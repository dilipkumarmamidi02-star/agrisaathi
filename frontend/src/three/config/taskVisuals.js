/**
 * TaskManager CATEGORIES -> a color for its post on the ops board
 * (spec #55 "Task Manager": "irrigation, fertilizer, spraying,
 * harvesting, livestock care... Completed tasks -> subtle
 * field-progress visualization").
 */
export const TASK_CATEGORY_COLORS = {
  planting: '#22c55e',
  weeding: '#f59e0b',
  feeding: '#fb7185',
  irrigation: '#06b6d4',
  harvest: '#f97316',
  maintenance: '#3b82f6',
  other: '#9ca3af',
};

export function getTaskColor(category) {
  return TASK_CATEGORY_COLORS[category] || TASK_CATEGORY_COLORS.other;
}
