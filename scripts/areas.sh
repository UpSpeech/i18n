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
  practice)
    node scripts/plan-area.mjs practice \
      --prefixes exercise_,games_,scenarios_,scenario_,reading_,practice_,recording_,session_,self_,retry_,daily_,celebration_,disfluency_,mini_,waveform_,exit_,pause_,recorder_,sound_,framing_,streak_,effort_,naturalness_,video_,camera_ \
      --scope exercises.,scenarios.,recording.,practice.,live_session.,learning_path.step_review.,daily_severity. \
      --dynamic disfluency_type_,exercise_category_,exercise_dimension_,exercise_disfluency_,exercise_journal_mood_,exit_speed_,games_animal_,games_pause_road_mode_,games_speech_,games_spin_cards_result_,games_story_scene_arms_,games_story_scene_character_,games_story_scene_colour_,games_story_scene_face_,games_story_scene_pose_,games_story_scene_setting_,games_two_choice_,games_which_speech_picked_,reading_prompt_length_,retry_reason_,scenario_realtime_end_reason_,scenario_realtime_fallback_,scenarios_mode_ \
      --parent disfluency_type_=exercises.disfluency_type,exercise_category_=exercises.category,exercise_dimension_=exercises.dimension,exercise_disfluency_=exercises.disfluency,exercise_journal_mood_=exercises.journal.moods,exit_speed_=exercises.exit_speed,reading_prompt_length_=exercises.reading_prompt.length,scenario_realtime_fallback_=scenarios.realtime.fallback,scenarios_mode_=scenarios.mode,games_speech_=exercises.games.speech,games_story_scene_character_=exercises.games.story_scene.character,games_story_scene_colour_=exercises.games.story_scene.colours,games_animal_=exercises.games.animal,games_two_choice_=exercises.games.two_choice_words,games_spin_cards_result_=exercises.games.spin_cards.result,games_pause_road_mode_=exercises.games.pause_road.mode,games_which_speech_picked_=exercises.games.which_speech.picked,games_story_scene_setting_=exercises.games.story_scene.setting,games_story_scene_face_=exercises.games.story_scene.faces,games_story_scene_arms_=exercises.games.story_scene.arms_options,games_story_scene_pose_=exercises.games.story_scene.poses,exercise_observation_=exercises.observation,exercise_self_modeling_=exercises.self_modeling,exercise_motor_control_=exercises.motor_control,exercise_pause_=exercises.pause,exercise_generalisation_=exercises.generalisation,exercise_reflection_=exercises.reflection,exercise_journal_=exercises.journal,exercise_=exercises.common,self_annotation_=recording.self_annotation,session_=practice.session,video_=recording.video,streak_=progress.streak,scenario_realtime_=scenarios.realtime,scenario_=scenarios.single,games_=exercises.games,scenarios_=scenarios.mobile,reading_=exercises.reading,practice_=practice,recording_=recording,retry_=exercises.retry,daily_=daily_severity.mobile,celebration_=exercises.celebration,mini_=exercises.mini_games,waveform_=recording.waveform,recorder_=recording.recorder,sound_=recording.sound,framing_=recording.framing,effort_=exercises.effort,naturalness_=exercises.naturalness,camera_=recording.camera,pause_=exercises.pause_screen,retry_reason_=exercises.retry_reason.labels,scenario_realtime_end_reason_=scenarios.session.end_reason_labels \
      --picks scripts/picks/practice.json
    ;;
  *) echo "usage: scripts/areas.sh <area>"; exit 2 ;;
esac
