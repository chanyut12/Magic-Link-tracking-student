import { MENU_ITEMS, type MenuItem } from '../constants/permissions';
import type { PermissionMenuItem } from '../types/user';

function mapMenuItems(items: MenuItem[]): PermissionMenuItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    expanded: false,
    ...(item.children ? { children: mapMenuItems(item.children) } : {}),
  }));
}

export function createPermissionMenuItems(
  source: MenuItem[] = MENU_ITEMS,
): PermissionMenuItem[] {
  return mapMenuItems(source);
}

export function collectLeafPermissionIds(items: PermissionMenuItem[]): string[] {
  return items.flatMap((item) => (
    item.children && item.children.length > 0
      ? collectLeafPermissionIds(item.children)
      : [item.id]
  ));
}

export function buildPermissionLabelMap(
  items: PermissionMenuItem[],
): Record<string, string> {
  const pairs = items.flatMap((item) => (
    item.children?.length
      ? item.children.map((child) => [child.id, child.label] as const)
      : [[item.id, item.label] as const]
  ));

  return Object.fromEntries(pairs);
}

