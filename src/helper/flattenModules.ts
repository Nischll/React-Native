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
