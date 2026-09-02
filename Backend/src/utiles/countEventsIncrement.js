import CountEvent from "../models/countEvents.js";

export const countIncrementAlert = async () => {
  const today = new Date().toISOString().split("T")[0];

  let record = await CountEvent.findOne();

  if (!record) {
    record = await CountEvent.create({ count: 1, date: today });
  } else if (record.date !== today) {
    record.count = 1;
    record.date = today;
    await record.save();
  } else {
    record.count += 1;
    await record.save();
  }

  return record.count;
};

export const getCountAlert = async () => {
  const today = new Date().toISOString().split("T")[0];
  const record = await CountEvent.findOne();
  if (!record || record.date !== today) return 0;

  return record.count;
};
