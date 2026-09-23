import type { ImageSourcePropType } from 'react-native';

// Keep every Metro require literal; dynamic require paths are not bundled.
export const ROOM_BASE_SOURCE: ImageSourcePropType = require('../../assets/2d/master/FINNI-2D-MASTER-V1/room_clean_v1.png');

export const OBJECT_SOURCES: Readonly<Record<string, ImageSourcePropType>> = Object.freeze({
  'OBJ-PLANNER': require('../../assets/2d/room/S8-002/png/obj_planner.png'),
  'OBJ-CHEST': require('../../assets/2d/room/S8-002/png/obj_chest.png'),
  'OBJ-CARE': require('../../assets/2d/room/S8-002/png/obj_care.png'),
  'OBJ-GOAL-DISPLAY': require('../../assets/2d/room/S8-002/png/obj_goal_display.png'),
  'OBJ-COIN': require('../../assets/2d/room/S8-002/png/obj_coin.png'),
});

export const ITEM_SOURCES: Readonly<Record<string, ImageSourcePropType>> = Object.freeze({
  'IT-01': require('../../assets/2d/room/S8-002/png/it_01.png'),
  'IT-02': require('../../assets/2d/room/S8-002/png/it_02.png'),
  'IT-03': require('../../assets/2d/room/S8-002/png/it_03.png'),
  'IT-04': require('../../assets/2d/room/S8-002/png/it_04.png'),
  'IT-05': require('../../assets/2d/room/S8-002/png/it_05.png'),
  'IT-06': require('../../assets/2d/room/S8-002/png/it_06.png'),
  'IT-07': require('../../assets/2d/room/S8-002/png/it_07.png'),
  'IT-08': require('../../assets/2d/room/S8-002/png/it_08.png'),
});

export const GOAL_SOURCES: Readonly<Record<string, ImageSourcePropType>> = Object.freeze({
  'GL-01': require('../../assets/2d/room/S8-002/png/gl_01.png'),
  'GL-02': require('../../assets/2d/room/S8-002/png/gl_02.png'),
  'GL-03': require('../../assets/2d/room/S8-002/png/gl_03.png'),
});

export function itemSource(itemId: string): ImageSourcePropType | null {
  return ITEM_SOURCES[itemId] ?? null;
}

export function goalSource(goalId: string | null): ImageSourcePropType | null {
  return goalId ? GOAL_SOURCES[goalId] ?? null : null;
}
