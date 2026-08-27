import { clearAuthCookies } from "../../../supabase-auth-server";
export async function GET(request:Request){await clearAuthCookies();return Response.redirect(new URL("/",request.url),303)}
