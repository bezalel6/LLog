export function isProd() {
  return !isDev();
}
export function isDev() {
  const ret = location.href.includes("localhost");
  if (ret) {
    console.log("--DETECTED DEV ENV--");
  } else {
    console.log("--DETECTED PROD ENV--");
  }
  return ret;
}

export function envDependentValue<ProdType, DevType = ProdType>(
  prod: ProdType,
  dev: DevType
): ProdType | DevType {
  return isDev() ? dev : prod;
}
