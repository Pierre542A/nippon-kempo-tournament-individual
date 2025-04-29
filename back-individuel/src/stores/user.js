import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  persist: true,
  state: () => ({
    token: null,
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    isActive: false,
    isAdmin: false,
    idRole: null,
    idClub: null,
    permissions: []  // tableau de permissions de l utilisatteur
  }),
  getters: {
    canModifyClubInfo:  state => state.permissions.includes('modify_club_info'),
    canManageClubUsers: state => state.permissions.includes('manage_club_users'),
    canManageTournaments: state => state.permissions.includes('manage_tournaments'),
  },
  actions: {
    setUser(data) {
      this.token      = data.token
      this.id         = data.id
      this.firstName  = data.first_name
      this.lastName   = data.last_name
      this.email      = data.email
      this.isActive   = data.is_active
      this.isAdmin    = data.is_admin
      this.idRole     = data.id_role
      this.idClub     = data.id_club
    },
    setPermissions(perms) {
      this.permissions = perms
    },
    clearUser() {
      this.$reset()
    }
  }
})
