#!/bin/bash
# The plan-area.mjs call for each area plan 540 has moved, so a map can be rebuilt.
set -e
cd "$(dirname "$0")/.."
case "$1" in
  settings)
    node scripts/plan-area.mjs settings \
      --prefixes companion_,settings_,accessibility_,biometric_,delete_,more_,theme_,tab_,update_,offline_,network_ \
      --scope settings.,navigation. \
      --dynamic companion_style_,theme_ \
      --parent network_=network,theme_=settings.theme,delete_=settings.delete,offline_=offline,biometric_gate_=settings.biometric_gate,biometric_sign_in_=auth.biometric_sign_in,biometric_=settings.biometric,update_=update \
      --picks scripts/picks/settings.json
    ;;
  notifications)
    node scripts/plan-area.mjs notifications \
      --prefixes notification_,notifications_,reminders_,reminder_,messages_,chat_,ask_ \
      --scope notifications.,messages.,chatbot.,patient_chatbot.,caregiver_ask. \
      --dynamic notification_type_,notification_settings_digest_,messages_starter_ \
      --parent notifications_=notifications.inbox,reminders_stop_=notifications.reminders_stop,reminder_card_=notifications.reminder_card,reminder_=notifications.reminder,messages_day_=messages.day,notification_type_=notifications.type_short \
      --picks scripts/picks/notifications.json
    ;;
  quiz)
    node scripts/plan-area.mjs quiz --prefixes quiz.,quiz_ --scope quiz. --picks scripts/picks/quiz.json
    ;;
  caregiver)
    node scripts/plan-area.mjs caregiver \
      --prefixes caregiver_,guardian_,child_,invite_,consultation_ \
      --scope learning_path.,onboarding.guardian.,caregiver.,invites.,patients.invite_modal.,consultation. \
      --dynamic caregiver_relationship_,caregiver_reminder_ \
      --parent caregiver_relationship_=dashboard.caregiver.relationship,child_=child_mode,consultation_exercises_=learning_path.consultation_exercises \
      --picks scripts/picks/caregiver.json
    ;;
  learning_path)
    node scripts/plan-area.mjs learning_path \
      --prefixes path_,learning_,step_,homework_,journey_,milestone_,acknowledgment_,aids_,technique_,today_,assignment_,assignments_,plan_,lp_,judgment_,redesign_,therapist_ \
      --scope learning_path.,exercises.learning_path.,exercises.homework.,dashboard.,exercises.technique_rating.,patients. \
      --dynamic lp_status_,judgment_severity_value_,redesign_sticker_ \
      --parent technique_=exercises.technique_names,assignment_=exercises.assignment,assignments_=exercises.assignments,path_=learning_path.editor,therapist_home_=dashboard.therapist.home \
      --picks scripts/picks/learning_path.json
    ;;
  *) echo "usage: scripts/areas.sh <area>"; exit 2 ;;
esac
