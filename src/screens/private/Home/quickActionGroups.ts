export type QuickActionItem = {
  title: string;
  path: string;
};

export type QuickActionGroup<T extends QuickActionItem> = {
  label: string;
  items: T[];
};

type GroupRule = {
  label: string;
  order: string[];
  test: (path: string, name: string) => boolean;
};

function normalizePath(path: string): string {
  return path.replace(/^\//, "").toLowerCase();
}

function includesAny(value: string, fragments: string[]): boolean {
  return fragments.some((fragment) => value.includes(fragment));
}

function isTemplate(path: string, name: string): boolean {
  return path.includes("template") || name.includes("template");
}

/**
 * Home Quick Actions, in display order. Earlier rules win.
 * The longest matching fragment decides order inside a group, so
 * "resident-form-forwards" stays after "resident-forms".
 */
const GROUP_RULES: GroupRule[] = [
  {
    label: "Resident",
    order: [
      "resident-management",
      "resident information",
      "resident-forms",
      "resident forms",
      "resident-form-forward",
      "forward resident",
      "visitor-parking",
      "visitor parking",
    ],
    test: (path, name) => {
      if (path.includes("revenue") || name.includes("revenue")) return false;
      return includesAny(`${path} ${name}`, [
        "resident-management",
        "resident information",
        "resident management",
        "resident-form",
        "resident form",
        "forward resident",
        "visitor-parking",
        "visitor parking",
      ]);
    },
  },
  {
    label: "Operation",
    order: [
      "task-management",
      "task management",
      "booking-management",
      "booking management",
      "parcel",
    ],
    test: (path, name) =>
      includesAny(`${path} ${name}`, [
        "task-management",
        "task management",
        "booking-management",
        "booking management",
        "parcel",
      ]),
  },
  {
    label: "Maintenance",
    order: [
      "trade-management",
      "trade management",
      "preventative",
      "building-improvement",
      "building improvement",
    ],
    test: (path, name) => {
      if (path.includes("trade-directory") || name.includes("trade directory")) {
        return false;
      }
      return includesAny(`${path} ${name}`, [
        "trade-management",
        "trade management",
        "preventative",
        "building-improvement",
        "building improvement",
      ]);
    },
  },
  {
    label: "Finance",
    order: ["purchase", "revenue"],
    test: (path, name) =>
      includesAny(`${path} ${name}`, ["purchase", "revenue"]),
  },
  {
    label: "Test and Inspection",
    order: [
      "generator",
      "pre-post",
      "pre and post",
      "overnight-concierge-patrol",
      "overnight",
    ],
    test: (path, name) => {
      if (isTemplate(path, name)) return false;
      return includesAny(`${path} ${name}`, [
        "generator",
        "pre-post",
        "pre and post",
        "overnight-concierge-patrol",
        "overnight concierge",
        "overnight security",
      ]);
    },
  },
  {
    label: "Checklist",
    order: ["daily", "weekly", "monthly", "annual"],
    test: (path, name) =>
      (path.includes("checklist") || name.includes("checklist")) &&
      !isTemplate(path, name),
  },
  {
    label: "Records",
    order: [
      "reporting",
      "report",
      "resources",
      "resource",
      "training-development",
      "training",
    ],
    test: (path, name) => {
      if (isTemplate(path, name)) return false;
      return includesAny(`${path} ${name}`, [
        "reporting",
        "report",
        "resources",
        "resource",
        "training",
      ]);
    },
  },
];

function itemRank(item: QuickActionItem, order: string[]): number {
  const path = normalizePath(item.path);
  const name = item.title.trim().toLowerCase();
  let bestIndex = order.length;
  let bestLength = -1;

  order.forEach((fragment, index) => {
    const nameFragment = fragment.replace(/-/g, " ");
    const pathHit = path.includes(fragment);
    const nameHit = name.includes(nameFragment);
    const length = pathHit ? fragment.length : nameHit ? nameFragment.length : 0;
    if (length > bestLength) {
      bestLength = length;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export function groupQuickActions<T extends QuickActionItem>(
  items: T[],
): QuickActionGroup<T>[] {
  const buckets = GROUP_RULES.map((rule) => ({
    label: rule.label,
    items: [] as T[],
  }));

  for (const item of items) {
    const path = normalizePath(item.path);
    const name = item.title.trim().toLowerCase();
    const ruleIndex = GROUP_RULES.findIndex((rule) => rule.test(path, name));
    if (ruleIndex === -1) continue;
    buckets[ruleIndex].items.push(item);
  }

  return buckets
    .map((bucket, index) => ({
      label: bucket.label,
      items: [...bucket.items].sort(
        (a, b) =>
          itemRank(a, GROUP_RULES[index].order) -
          itemRank(b, GROUP_RULES[index].order),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
