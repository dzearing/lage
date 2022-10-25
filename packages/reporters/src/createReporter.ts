import { LogLevel } from "@lage-run/logger";
import { JsonReporter } from "./JsonReporter";
import { AdoReporter } from "./AdoReporter";
import { LogReporter } from "./LogReporter";
import { InkReporter } from "./InkReporter/InkReporter";

export function createReporter({
  reporter = "npmLog",
  grouped = false,
  verbose = false,
  logLevel = LogLevel.info,
}: {
  reporter: string;
  grouped?: boolean;
  verbose?: boolean;
  logLevel?: LogLevel;
}) {
  switch (reporter) {
    case "json":
      return new JsonReporter({ logLevel });
    case "azureDevops":
    case "adoLog":
      return new AdoReporter({ grouped, logLevel: verbose ? LogLevel.verbose : logLevel });
    case "ink":
      return new InkReporter({ grouped, logLevel: verbose ? LogLevel.verbose : logLevel });
    default:
      return new LogReporter({ grouped, logLevel: verbose ? LogLevel.verbose : logLevel });
  }
}
