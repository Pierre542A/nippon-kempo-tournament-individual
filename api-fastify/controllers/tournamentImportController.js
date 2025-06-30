// controllers/TournamentImportController.js
class TournamentImportController {
  constructor(fastify) {
    this.fastify = fastify;
    this.mysql = fastify.mysql;
  }

  // Fonction pour nettoyer le format de date
  cleanDateFormat(dateString) {
    if (!dateString) return null;
    
    try {
      // Si c'est au format ISO avec partie temporelle (YYYY-MM-DDT...)
      if (dateString.includes('T')) {
        // Extraire uniquement la partie date (YYYY-MM-DD)
        return dateString.split('T')[0];
      }
      return dateString;
    } catch (e) {
      console.error("Erreur lors du nettoyage de la date:", e);
      return dateString;
    }
  }

  async importTournament(req, reply) {
    try {
      const { tournament, participants, categories, matches, importType } = req.body;
      
      // Déterminer le statut du tournoi en fonction des données
      let tournamentStatus = 'open';

      // Première vérification : le tournoi est-il déclaré comme "started" ?
      if (tournament.started) {
        // Deuxième vérification : toutes les catégories ont-elles un gagnant ?
        const allCategoriesHaveWinners = categories && categories.length > 0 && 
                                        categories.every(category => category.idWinner);
        
        if (allCategoriesHaveWinners) {
          // Si le tournoi a démarré ET toutes les catégories ont un gagnant
          tournamentStatus = 'closed';
        } else {
          // Si le tournoi a démarré mais toutes les catégories n'ont pas encore de gagnant
          tournamentStatus = 'in_progress';
        }
      } else {
        // Si le tournoi n'a pas encore démarré
        tournamentStatus = 'open';
      }

      // Surcharger avec le type d'importation explicite si nécessaire
      if (importType === 'results') {
        tournamentStatus = 'closed';
      }      
      // Étape 1: Vérifier si le tournoi existe déjà (nom, date et adresse)
      const [existingTournaments] = await this.mysql.execute(
        `SELECT id FROM tournaments 
         WHERE name = ? AND start_date = ? AND address = ?`,
        [tournament.name, tournament.start_date, tournament.address || null]
      );
      
      let tournamentId;
      let tournamentCreated = false;
      let tournamentUpdated = false;
      
      if (existingTournaments.length > 0) {
        // Le tournoi existe déjà, on récupère son ID
        tournamentId = existingTournaments[0].id;
        
        // Mise à jour du tournoi existant
        await this.mysql.execute(
          `UPDATE tournaments 
           SET end_date = ?, status = ?
           WHERE id = ?`,
          [tournament.end_date, tournamentStatus, tournamentId]
        );
        tournamentUpdated = true;
      } else {
        // Créer un nouveau tournoi
        const [tournamentResult] = await this.mysql.execute(
          `INSERT INTO tournaments (id_club, name, address, start_date, end_date, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            tournament.id_club || null,
            tournament.name,
            tournament.address || null,
            tournament.start_date,
            tournament.end_date,
            tournamentStatus
          ]
        );
        
        tournamentId = tournamentResult.insertId;
        tournamentCreated = true;
      }
      
      // Compteurs pour le résumé
      let newParticipants = 0;
      let updatedParticipants = 0;
      let newCategories = 0;
      let updatedCategories = 0;
      let newMatches = 0;
      let failedMatches = 0;
      
      // Étape 2: Traiter les participants
      // Garder une correspondance entre les IDs externes et les IDs en base
      const userIdMap = new Map();
            
      for (const participant of participants) {
        try {
          // Déterminer l'ID externe (s'adapter à différentes structures possibles)
          let externalId;
          
          if (participant.externalId !== undefined) {
            externalId = participant.externalId;
          } else if (participant.id !== undefined) {
            externalId = participant.id;
          } else if (participant.source && participant.source.id !== undefined) {
            externalId = participant.source.id;
          } else {
            // Si aucun ID externe n'est trouvé, générer un ID unique basé sur le nom et la date de naissance
            externalId = `${participant.first_name || ""}-${participant.last_name || ""}-${participant.birth_date || ""}`;
          }
          
          // S'assurer que l'ID externe est une chaîne
          externalId = String(externalId);
                    
          // Normaliser les données du participant
          const firstName = participant.first_name || participant.firstName || "";
          const lastName = participant.last_name || participant.lastName || "";
          
          // IMPORTANT: Nettoyer le format de la date de naissance
          const rawBirthDate = participant.birth_date || participant.birthDate || null;
          const birthDate = this.cleanDateFormat(rawBirthDate);
                    
          const email = participant.email || "";
          const weight = participant.weight || 0;
          
          // Déterminer les IDs de genre et grade
          let genderId = null;
          if (participant.genderId !== undefined) {
            genderId = participant.genderId;
          } else if (participant.gender_id !== undefined) {
            genderId = participant.gender_id;
          } else if (participant.id_gender !== undefined) {
            genderId = participant.id_gender;
          }
          
          let gradeId = null;
          if (participant.gradeId !== undefined) {
            gradeId = participant.gradeId;
          } else if (participant.grade_id !== undefined) {
            gradeId = participant.grade_id;
          } else if (participant.id_grade !== undefined) {
            gradeId = participant.id_grade;
          }
          
          // Si genderId ou gradeId sont des objets, extraire leur valeur
          if (typeof genderId === 'object' && genderId !== null && genderId.value !== undefined) {
            genderId = genderId.value;
          }
          
          if (typeof gradeId === 'object' && gradeId !== null && gradeId.value !== undefined) {
            gradeId = gradeId.value;
          }
                    
          // Vérifier si l'utilisateur existe déjà (par nom, prénom et date de naissance)
          const [existingUsers] = await this.mysql.execute(
            `SELECT id FROM users 
             WHERE first_name = ? AND last_name = ? AND birth_date = ?`,
            [firstName, lastName, birthDate]
          );
          
          let userId;
          
          if (existingUsers.length > 0) {
            // Mettre à jour l'utilisateur existant
            userId = existingUsers[0].id;
            
            // Ne pas définir id_tournament_waiting si c'est un import de résultats
            const tournamentWaitingId = tournamentStatus === 'open' ? tournamentId : null;
            
            await this.mysql.execute(
              `UPDATE users 
               SET weight = ?, email = ?, id_tournament_waiting = ?,
                  id_gender = ?, id_grade = ?
               WHERE id = ?`,
              [
                weight, 
                email, 
                tournamentWaitingId, // Peut être null si c'est un import de résultats
                genderId || null,
                gradeId || null,
                userId
              ]
            );
            updatedParticipants++;
          } else {
            // Créer un nouvel utilisateur
            try {
              // Ne pas définir id_tournament_waiting si c'est un import de résultats
              const tournamentWaitingId = tournamentStatus === 'open' ? tournamentId : null;
              
              const [insertResult] = await this.mysql.execute(
                `INSERT INTO users (
                   first_name, last_name, email, birth_date, weight,
                   id_role, avatar_seed, is_active, id_gender, id_grade, id_tournament_waiting
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  firstName,
                  lastName,
                  email,
                  birthDate, // Date nettoyée
                  weight || null,
                  3, // Rôle participant par défaut
                  'default', // Avatar par défaut
                  true, // Compte actif
                  genderId || null,
                  gradeId || null,
                  tournamentWaitingId // Peut être null si c'est un import de résultats
                ]
              );
              userId = insertResult.insertId;
              newParticipants++;
            } catch (createError) {
              console.error(`Erreur création participant ${firstName} ${lastName}:`, createError);
              console.error(`SQL: INSERT INTO users (first_name, last_name, email, birth_date...) VALUES (${firstName}, ${lastName}, ${email}, ${birthDate}, ...)`);
              // Continuer l'exécution
              continue;
            }
          }
          
          // Stocker la correspondance entre l'ID externe et l'ID BDD
          userIdMap.set(externalId, userId);
          
        } catch (participantError) {
          console.error(`Erreur lors du traitement du participant ${participant.first_name || participant.firstName || "inconnu"} ${participant.last_name || participant.lastName || "inconnu"}:`, participantError);
          // Continuer avec le prochain participant
        }
      }
      
      // Étape 3: Importer les catégories
      const categoryIdMap = new Map(); // Pour stocker les correspondances d'IDs des catégories
      
      if (categories && categories.length > 0) {        
        for (const category of categories) {
          try {
            // Déterminer l'ID externe de la catégorie
            let externalId;
            if (category.externalId !== undefined) {
              externalId = category.externalId;
            } else if (category.id !== undefined) {
              externalId = category.id;
            } else if (category.source && category.source.id !== undefined) {
              externalId = category.source.id;
            } else {
              // Si aucun ID externe n'est trouvé, utiliser le nom comme clé
              externalId = category.name;
            }
            
            // S'assurer que l'ID externe est une chaîne
            externalId = String(externalId);
            
            // Normaliser les données de la catégorie
            let minGradeId = null;
            if (category.minGradeId !== undefined) {
              minGradeId = category.minGradeId;
            } else if (category.min_grade_id !== undefined) {
              minGradeId = category.min_grade_id;
            } else if (category.id_grade_minimum !== undefined) {
              minGradeId = category.id_grade_minimum;
            }
            
            let maxGradeId = null;
            if (category.maxGradeId !== undefined) {
              maxGradeId = category.maxGradeId;
            } else if (category.max_grade_id !== undefined) {
              maxGradeId = category.max_grade_id;
            } else if (category.id_grade_maximum !== undefined) {
              maxGradeId = category.id_grade_maximum;
            }
            
            let typeId = null;
            if (category.typeId !== undefined) {
              typeId = category.typeId;
            } else if (category.type_id !== undefined) {
              typeId = category.type_id;
            } else if (category.id_category_type !== undefined) {
              typeId = category.id_category_type;
            }
            
            // Si les IDs sont des objets, extraire leur valeur
            if (typeof minGradeId === 'object' && minGradeId !== null && minGradeId.value !== undefined) {
              minGradeId = minGradeId.value;
            }
            
            if (typeof maxGradeId === 'object' && maxGradeId !== null && maxGradeId.value !== undefined) {
              maxGradeId = maxGradeId.value;
            }
            
            if (typeof typeId === 'object' && typeId !== null && typeId.value !== undefined) {
              typeId = typeId.value;
            }
                        
            // Vérifier si la catégorie existe déjà dans ce tournoi
            const [existingCategories] = await this.mysql.execute(
              `SELECT id FROM categories 
               WHERE id_tournament = ? AND name = ?`,
              [tournamentId, category.name]
            );
            
            let categoryId;
            
            if (existingCategories.length > 0) {
              // La catégorie existe déjà, on récupère son ID
              categoryId = existingCategories[0].id;
              
              // Mise à jour des informations de la catégorie
              await this.mysql.execute(
                `UPDATE categories 
                 SET id_grade_minimum = ?, id_grade_maximum = ?, id_category_type = ?
                 WHERE id = ?`,
                [
                  minGradeId || 1,
                  maxGradeId || 17,
                  typeId || 1,
                  categoryId
                ]
              );
              
              updatedCategories++;
            } else {
              // Créer une nouvelle catégorie
              const [result] = await this.mysql.execute(
                `INSERT INTO categories (
                  id_tournament, 
                  id_grade_minimum, 
                  id_grade_maximum, 
                  id_category_type, 
                  name
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                  tournamentId,
                  minGradeId || 1,
                  maxGradeId || 17,
                  typeId || 1, // 1 pour Poule, 2 pour Tableau par défaut
                  category.name
                ]
              );
              
              categoryId = result.insertId;
              newCategories++;
            }
            
            // Stocker la correspondance entre l'ID externe et l'ID BDD
            categoryIdMap.set(externalId, categoryId);            
          } catch (categoryError) {
            console.error(`Erreur lors de l'importation de la catégorie ${category.name}:`, categoryError);
            // Continuer avec la prochaine catégorie
          }
        }
      }
      
      // Étape 4: Importer les matchs
      // IMPORTANT: Nous importons maintenant les matchs quel que soit le type d'importation
      if (matches && matches.length > 0) {
        
        for (const match of matches) {
          try {            
            // Déterminer les IDs des joueurs (s'adapter à différentes structures possibles)
            let idPlayer1, idPlayer2, idWinner;
            
            // Extraction de l'ID du joueur 1
            if (match.idPlayer1 !== undefined) {
              idPlayer1 = match.idPlayer1;
            } else if (match.player1Id !== undefined) {
              idPlayer1 = match.player1Id;
            } else if (match.whitePlayerId !== undefined) {
              idPlayer1 = match.whitePlayerId;
            } else if (match.source && match.source.idPlayer1 !== undefined) {
              idPlayer1 = match.source.idPlayer1;
            }
            
            // Extraction de l'ID du joueur 2
            if (match.idPlayer2 !== undefined) {
              idPlayer2 = match.idPlayer2;
            } else if (match.player2Id !== undefined) {
              idPlayer2 = match.player2Id;
            } else if (match.redPlayerId !== undefined) {
              idPlayer2 = match.redPlayerId;
            } else if (match.source && match.source.idPlayer2 !== undefined) {
              idPlayer2 = match.source.idPlayer2;
            }
            
            // Extraction de l'ID du gagnant
            if (match.idWinner !== undefined) {
              idWinner = match.idWinner;
            } else if (match.winnerId !== undefined) {
              idWinner = match.winnerId;
            } else if (match.source && match.source.idWinner !== undefined) {
              idWinner = match.source.idWinner;
            }
            
            // Convertir en chaînes pour la recherche dans le Map
            idPlayer1 = idPlayer1 !== undefined ? String(idPlayer1) : null;
            idPlayer2 = idPlayer2 !== undefined ? String(idPlayer2) : null;
            idWinner = idWinner !== undefined ? String(idWinner) : null;
                        
            // Récupérer les IDs des utilisateurs dans notre BDD
            const idUsersWhite = idPlayer1 ? userIdMap.get(idPlayer1) : null;
            const idUsersRed = idPlayer2 ? userIdMap.get(idPlayer2) : null;
            let idWinnerDB = null;
            
            if (idWinner && idWinner !== '-1' && idWinner !== '0') {
              idWinnerDB = userIdMap.get(idWinner);
            }
                        
            // Normaliser les données du match
            const ipponsWhite = match.ipponsPlayer1 || match.ippon_white || match.ippons_white || 0;
            const ipponsRed = match.ipponsPlayer2 || match.ippon_red || match.ippons_red || 0;
            const keikokusWhite = match.keikokusPlayer1 || match.keikoku_white || match.keikokus_white || 0;
            const keikokusRed = match.keikokusPlayer2 || match.keikoku_red || match.keikokus_red || 0;
            
            if (idUsersWhite && idUsersRed) {
              // Vérifier si le match existe déjà
              const [existingMatches] = await this.mysql.execute(
                `SELECT id FROM matchs 
                 WHERE id_tournament = ? AND id_users_white = ? AND id_users_red = ?`,
                [tournamentId, idUsersWhite, idUsersRed]
              );
              
              if (existingMatches.length === 0) {
                // Créer un nouveau match
                const [result] = await this.mysql.execute(
                  `INSERT INTO matchs (
                    id_tournament,
                    id_users_white,
                    id_users_red,
                    id_winner,
                    ippon_white,
                    ippon_red,
                    keikoku_white,
                    keikoku_red
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    tournamentId,
                    idUsersWhite,
                    idUsersRed,
                    idWinnerDB,
                    ipponsWhite,
                    ipponsRed,
                    keikokusWhite,
                    keikokusRed
                  ]
                );
                newMatches++;
              }
            } else {
              failedMatches++;
              console.error(`Impossible de créer le match: utilisateurs non trouvés (ID externes: ${idPlayer1}, ${idPlayer2})`);
            }
          } catch (matchError) {
            failedMatches++;
            console.error(`Erreur lors de l'importation d'un match:`, matchError);
            // Continuer avec le prochain match
          }
        }
      }
      
      return reply.send({
        success: true,
        message: `Importation réussie (type: ${importType})`,
        tournamentId,
        tournamentStatus,
        tournamentCreated: tournamentCreated ? 1 : 0,
        tournamentUpdated: tournamentUpdated ? 1 : 0,
        newParticipants,
        updatedParticipants,
        newCategories,
        updatedCategories,
        newMatches,
        failedMatches
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'importation du tournoi:', error);
      return reply.code(500).send({
        success: false,
        error: `Erreur lors de l'importation: ${error.message}`
      });
    }
  }
}

module.exports = TournamentImportController;