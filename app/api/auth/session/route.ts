import { currentUser, ensureUserAccess } from "../../../supabase-auth-server";
export async function GET(){const user=await currentUser();if(!user||!await ensureUserAccess(user))return Response.json({authenticated:false},{status:401});return Response.json({authenticated:true,user:{email:user.email}})}
