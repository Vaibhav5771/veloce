import { neon } from "@neondatabase/serverless";

export async function GET(request: Request, { id }: Record<string, string>) {
  try {
    const userEmail = decodeURIComponent(id);
    const sql = neon(`${process.env.DATABASE_URL}`);

    const rows = await sql`
      SELECT
        rides.origin_address,
        rides.destination_address,
        rides.origin_latitude,
        rides.origin_longitude,
        rides.destination_latitude,
        rides.destination_longitude,
        rides.ride_time,
        rides.fare_price,
        rides.payment_status,
        rides.driver_id,
        rides.user_email,
        rides.created_at,
        drivers.first_name AS driver_first_name,
        drivers.last_name AS driver_last_name,
        drivers.car_seats AS driver_car_seats
      FROM rides
      JOIN drivers ON drivers.id = rides.driver_id
      WHERE rides.user_email = ${userEmail}
      ORDER BY rides.created_at DESC;
    `;

    const rides = rows.map((row) => ({
      origin_address: row.origin_address,
      destination_address: row.destination_address,
      origin_latitude: row.origin_latitude,
      origin_longitude: row.origin_longitude,
      destination_latitude: row.destination_latitude,
      destination_longitude: row.destination_longitude,
      ride_time: row.ride_time,
      fare_price: row.fare_price,
      payment_status: row.payment_status,
      driver_id: row.driver_id,
      user_email: row.user_email,
      created_at: row.created_at,
      driver: {
        first_name: row.driver_first_name,
        last_name: row.driver_last_name,
        car_seats: row.driver_car_seats,
      },
    }));

    return Response.json({ data: rides });
  } catch (error) {
    console.error("Error fetching rides:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
