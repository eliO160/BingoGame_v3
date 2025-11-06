import mongoose from "mongoose";
const { Schema, models, model } = mongoose;

const PromptSchema = new Schema({
  text: { type: String, unique: true, required: true, trim: true },
  active: { type: Boolean, default: true },
  checkCount: { type: Number, default: 0 }  // global “times checked”
}, { timestamps: true });

PromptSchema.index({ active: 1 });
PromptSchema.index({ checkCount: -1 });

export default models.Prompt || model("Prompt", PromptSchema);
