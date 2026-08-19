type Module = {
  name: string;
  icon: string;
  code: string;
  path: string | null;
  moduleList: Module[];
};

export const flattenModules = (modules: Module[]): Module[] => {
  return modules.flatMap((mod) =>
    mod.path ? [mod] : flattenModules(mod.moduleList),
  );
};

export function hasModuleCode(modules: Module[], code: string): boolean {
  return modules.some(
    (mod) =>
      mod.code === code || hasModuleCode(mod.moduleList ?? [], code),
  );
}
