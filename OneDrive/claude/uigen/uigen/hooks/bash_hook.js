process.stdin.setEncoding("utf8");

let input = "";

process.stdin.on("data", (d) => (input += d));

process.stdin.on("end", () => {
  const toolArgs = JSON.parse(input);
  const command = toolArgs.tool_input?.command || "";

  if (command.includes(".env")) {
    console.error("You cannot run commands involving the .env file");
    process.exit(2);
  }

  process.exit(0);
});
