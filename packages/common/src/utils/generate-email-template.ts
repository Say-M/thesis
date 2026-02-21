import fs from "fs";
import path from "path";

const generateEmailHTML = async (
  template: string,
  data: { [key: string]: any },
): Promise<string> => {
  let html = fs.readFileSync
    ? fs.readFileSync(
        path.join(__dirname, "../templates/email", template),
        "utf8",
      )
    : "";

  for (const key in data) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), data[key]);
  }

  return html;
};

export default generateEmailHTML;
