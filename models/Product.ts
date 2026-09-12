import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  categoryId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name: string; slug: string };
  name: string;
  slug: string;
  description: string;
  price: number;
  stockQty: number;
  imagePath: string;
  isFeatured: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, min: 0, required: true },
    stockQty: { type: Number, min: 0, required: true },
    imagePath: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);