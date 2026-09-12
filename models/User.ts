import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({ name:{type:String,required:true}, email:{type:String,required:true,unique:true,lowercase:true}, passwordHash:{type:String,required:true,select:false}, role:{type:String,enum:["customer","admin"],default:"customer"}, // Bumped on password change — JWTs carrying an older value are rejected (kills old sessions instantly).
 tokenVersion:{type:Number,default:0} }, {timestamps:true});
export default mongoose.models.User || mongoose.model("User", UserSchema);
