import mongoose, { Schema } from "mongoose";
const CartSchema = new Schema({ userId:{type:Schema.Types.ObjectId,ref:"User",required:true,unique:true}, items:[{productId:{type:Schema.Types.ObjectId,ref:"Product",required:true},quantity:{type:Number,min:1,required:true}}] }, {timestamps:true});
export default mongoose.models.Cart || mongoose.model("Cart", CartSchema);