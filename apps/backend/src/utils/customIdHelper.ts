import { Model } from "mongoose";

export const generateIDBasedOnDate = async (
  prefix: string,
  model: Model<any>,
  field: string,
): Promise<string> => {
  let serial = "00001";
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const datePrefix = `${year}${month}${day}`;
  let customId: string;
  let isUnique = false;

  // Try to find a unique customId
  while (!isUnique) {
    customId = `${prefix}-${datePrefix}-${serial}`;
    // Check if customId exists
    const isExist = await model.findOne({
      [field]: customId,
    });

    if (!isExist) {
      isUnique = true;
    } else {
      serial = (parseInt(serial, 10) + 1).toString().padStart(5, "0");
    }
  }

  return customId!;
};
