import pc from "picocolors";

const NEXIO_ART = [
  "███╗   ██╗███████╗██╗  ██╗██╗ ██████╗ ",
  "████╗  ██║██╔════╝╚██╗██╔╝██║██╔═══██╗",
  "██╔██╗ ██║█████╗   ╚███╔╝ ██║██║   ██║",
  "██║╚██╗██║██╔══╝   ██╔██╗ ██║██║   ██║",
  "██║ ╚████║███████╗██╔╝ ██╗██║╚██████╔╝",
  "╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝ ",
] as const;

const TAGLINE = "Open-source orchestration for zero-human companies";

export function printNexioCliBanner(): void {
  const lines = [
    "",
    ...NEXIO_ART.map((line) => pc.cyan(line)),
    pc.blue("  ───────────────────────────────────────────────────────"),
    pc.bold(pc.white(`  ${TAGLINE}`)),
    "",
  ];

  console.log(lines.join("\n"));
}
