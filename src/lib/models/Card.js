import mongoose from "mongoose";
const { Schema, models, model } = mongoose;

const BoxSchema = new Schema({
  n: { type: Number, required: true },            // 1..25 (your checkWin uses this)
  row: { type: Number, required: true },
  col: { type: Number, required: true },
  promptId: { type: Schema.Types.ObjectId, ref: "Prompt", required: true },
  promptTextSnapshot: { type: String, required: true },
  checked: { type: Boolean, default: false },
  checkCount: { type: Number, default: 0 }        // per-player toggles to checked
}, { _id: false });

const CardSchema = new Schema({
  _id: { type: String, required: true },          // UUID in the URL
  size: { type: Number, default: 5 },
  boxes: { type: [BoxSchema], default: [] }
}, { timestamps: true });

CardSchema.path("boxes").validate(function (v) {
  return v.length === this.size * this.size;
}, "boxes length must equal size*size");

export default models.Card || model("Card", CardSchema);
