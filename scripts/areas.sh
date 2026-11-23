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
  *) echo "usage: scripts/areas.sh <area>"; exit 2 ;;
esac
