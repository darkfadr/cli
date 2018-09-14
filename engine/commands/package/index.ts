import { Utils } from "../../../common/utils";
import { BuildController } from "../../controllers/buildController";
import * as yargs from "yargs";
import { Context } from "../../../common/context";
import { translations } from "../../../common/translations";

export default {
  name: "package",
  handler: async (params: any, context: Context) => {
    context.spinner.start(context.i18n.t("package_progress"));

    const buildDir = await BuildController.compile(context);
    context.logger.debug(`build dir ${JSON.stringify(buildDir, null, 2)}`);

    await Utils.archive(
      [{ source: buildDir.build }, { source: context.storage.static.modules, dist: "node_modules" }],
      context.storage.static.buildRootDir,
      "build",
      context);

    await Utils.archive(
      [{ source: buildDir.summary }],
      context.storage.static.buildRootDir,
      "summary",
      context);

  },
  describe: translations.i18n.t("package_describe"),
  builder: (args: yargs.Argv): yargs.Argv => {
    return args.usage(translations.i18n.t("package_usage"));
  }
};
