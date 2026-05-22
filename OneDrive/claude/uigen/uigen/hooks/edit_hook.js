process.stdin.setEncoding("utf8");

let input = "";

process.stdin.on("data", (d) => (input += d));

process.stdin.on("end", () => {
  const toolArgs = JSON.parse(input);
  const editPath = toolArgs.tool_input?.file_path || "";

  if (editPath.includes(".env")) {
    console.error("You cannot edit the .env file");
    process.exit(2);
  }

  process.exit(0);
});
