// Folds the namespace files of one language into the single "translation"
// namespace both clients read, so t("common.loading") and t("auth.sign_in_title")
// resolve the same way everywhere. common also sits at the root, for keys such
// as pagination.showing.
/** @param {Record<string, any>} f the parsed namespace files, keyed by file name */
export function buildLocale(f) {
  return {
    impersonation: f.impersonation,
    translation: {
      ...f.common,
      common: f.common,
      auth: f.auth,
      dashboard: f.dashboard,
      client: f.dashboard.client,
      therapist: f.dashboard.therapist,
      owner: f.dashboard.owner,
      admin_dashboard: f.dashboard.admin_dashboard,
      owner_dashboard: f.dashboard.owner_dashboard,
      reports: f.reports,
      audio: f.audio,
      audio_recordings: f.audio.recordings,
      upload: f.audio.upload,
      annotations: f.audio.annotations,
      users: f.users.users,
      clients: f.users.clients,
      tenant: f.tenant.tenant,
      tenants: f.tenant.tenants,
      analytics: f.analytics,
      exercises: f.exercises,
      patients: f.patients,
      command_palette: f.command_palette,
      progress: f.progress,
      feature_flags: f.feature_flags,
      help: f.help,
      onboarding: f.onboarding.onboarding,
      feedback: f.feedback,
      validation: f.validation,
      page_titles: f.page_titles,
      scenarios: f.scenarios,
      quiz: f.quiz,
      cbsa: f.cbsa,
      daily_severity: f.daily_severity,
      expert_reviews: f.expert_reviews,
      special_access: f.special_access,
      pilot_accounts: f.pilot_accounts,
      pilot_assessment: f.pilot_assessment,
      pilot_control_room: f.pilot_control_room,
      invites: f.invites,
      notifications: f.notifications,
    },
  };
}

// The top-level keys above that repeat a part of another file. A key under one
// of them is reachable by its canonical path too, so reports skip them.
export const ALIASES = [
  "client",
  "therapist",
  "owner",
  "admin_dashboard",
  "owner_dashboard",
  "audio_recordings",
  "upload",
  "annotations",
];
