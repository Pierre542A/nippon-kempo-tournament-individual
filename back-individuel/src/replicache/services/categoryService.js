import { ParticipantService } from "@/replicache/services/participantService";
import { replicacheInstance as rep } from "../replicache";

export const CategoryService = {
  createCategory: async (tournamentId, data) => {
    const categoryId = crypto.randomUUID(); // genere un id aleatoire
    const newCategory = {
      id: categoryId,
      tournamentId,
      name: data.name,
      genderId: data.genderId,
      typeId: data.typeId,
      ageCategoryIds: data.ageCategoryIds,
      minGradeId: data.minGradeId,
      maxGradeId: data.maxGradeId,
      weightRange: data.weightRange,
      participantIds: [],
    };

    await rep.mutate.createCategory(newCategory);

    return newCategory; // retourne l'objet creer
  },

  updateCategory: async (id, updates) => {
    await rep.mutate.updateCategory({ id, updates });
  },

  deleteCategory: async (id) => {
    await rep.mutate.deleteCategory({ id });
  },

  addParticipant: async (categoryId, participantId) => {
    await rep.mutate.linkParticipant({ categoryId, participantId });
  },

  linkParticipants: async (categoryId, participantIds) => {
    await Promise.all(
      participantIds.map(async (participantId) => {
        await ParticipantService.updateParticipantCategory(participantId, categoryId);
      })
    );
  }
};
