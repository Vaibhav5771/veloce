import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { id, user_email } = await request.json();

    if (id === undefined || id === null || !user_email) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Scope the delete to the requesting user's own rides so a ride id alone
    // can't be used to delete someone else's history.
    const response = await sql`
      DELETE FROM rides
      WHERE id = ${id} AND user_email = ${user_email}
      RETURNING id;`;

    if (response.length === 0) {
      return Response.json(
        { error: "Ride not found" },
        { status: 404 },
      );
    }

    return Response.json({ data: response[0] }, { status: 200 });
  } catch (error) {
    console.error("Error deleting ride:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
