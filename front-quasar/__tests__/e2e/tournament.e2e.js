// __tests__/e2e/tournament.e2e.js
const supertest = require('supertest');
const { build } = require('../../app'); // Adaptez ce chemin à votre structure de projet

describe('Routes des tournois (E2E)', () => {
    let app;
    let request;
    let server;
    let token; // Pour les routes authentifiées

    // Setup - Créer une nouvelle instance de l'application avant chaque test
    beforeAll(async () => {
        // Créer une instance d'application pour les tests
        app = await build({
            logger: false,
            database: {
                // Utiliser une configuration de base de données de test
                // Par exemple une base de test ou un mock
            }
        });

        request = supertest(app.server);

        // Si vous avez besoin d'authentification pour vos tests
        const loginResponse = await request
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'testpassword'
            });

        token = loginResponse.body.token;
    });

    // Teardown - Fermer le serveur après tous les tests
    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/tournaments', () => {
        it('devrait retourner la liste des tournois', async () => {
            const response = await request
                .get('/api/tournaments')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('GET /api/tournaments/:id', () => {
        it('devrait retourner un tournoi spécifique', async () => {
            // Supposons qu'un tournoi avec ID 1 existe dans la base de test
            const response = await request
                .get('/api/tournaments/1')
                .expect(200);

            expect(response.body).toHaveProperty('id', 1);
        });

        it('devrait retourner 404 pour un tournoi inexistant', async () => {
            const response = await request
                .get('/api/tournaments/9999')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/tournaments/:id/register', () => {
        it('devrait inscrire un utilisateur à un tournoi', async () => {
            // Cette route nécessite une authentification
            const response = await request
                .post('/api/tournaments/1/register')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('devrait refuser l\'inscription sans authentification', async () => {
            await request
                .post('/api/tournaments/1/register')
                .expect(401);
        });
    });

    // Vous pouvez ajouter d'autres tests selon vos besoins
});