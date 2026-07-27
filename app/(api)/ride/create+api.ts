import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const {
      origin_address,
      destination_address,
      origin_latitude,
      origin_longitude,
      destination_latitude,
      destination_longitude,
      ride_time,
      fare_price,
      payment_status,
      driver_id,
      user_email,
    } = await request.json();

    if (
      !origin_address ||
      !destination_address ||
      !user_email ||
      driver_id === undefined ||
      driver_id === null
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const response = await sql`
      INSERT INTO rides (
        origin_address,
        destination_address,
        origin_latitude,
        origin_longitude,
        destination_latitude,
        destination_longitude,
        ride_time,
        fare_price,
        payment_status,
        driver_id,
        user_email
      )
      VALUES (
        ${origin_address},
        ${destination_address},
        ${origin_latitude},
        ${origin_longitude},
        ${destination_latitude},
        ${destination_longitude},
        ${ride_time},
        ${fare_price},
        ${payment_status},
        ${driver_id},
        ${user_email}
      )
      RETURNING *;`;

    return Response.json({ data: response[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating ride:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
