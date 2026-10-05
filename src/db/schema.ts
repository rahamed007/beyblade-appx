import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/** A single Bey inside a player's 3-Bey deck (Beyblade X "3on3" rule). */
export type DeckBey = {
  name: string;
  blade: string;
  ratchet: string;
  bit: string;
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("organizer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Bey / part catalog: a combo is blade + ratchet + bit. */
export const beyblades = pgTable("beyblades", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  blade: text("blade").notNull(),
  ratchet: text("ratchet").notNull(),
  bit: text("bit").notNull(),
  type: text("type").notNull().default("balance"),
  spin: text("spin").notNull().default("right"),
  owner: text("owner"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Blader profiles. Optionally linked to a login account. */
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  bladerName: text("blader_name").notNull().unique(),
  realName: text("real_name"),
  region: text("region"),
  team: text("team"),
  launchStyle: text("launch_style").notNull().default("right"),
  signatureMove: text("signature_move"),
  bio: text("bio"),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  battleWins: integer("battle_wins").notNull().default(0),
  battleLosses: integer("battle_losses").notNull().default(0),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  location: text("location"),
  format: text("format").notNull().default("3on3"),
  matchType: text("match_type").notNull().default("4-point"),
  maxPlayers: integer("max_players").notNull().default(8),
  status: text("status").notNull().default("registration"),
  prizePool: text("prize_pool"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const registrations = pgTable(
  "registrations",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    seed: integer("seed").notNull().default(0),
    status: text("status").notNull().default("confirmed"),
    deck: jsonb("deck").$type<DeckBey[]>().notNull().default([]),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("registrations_tournament_player_key").on(
      table.tournamentId,
      table.playerId,
    ),
  ],
);

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  round: integer("round").notNull().default(1),
  tableNumber: integer("table_number").notNull().default(1),
  playerAId: integer("player_a_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  playerBId: integer("player_b_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  scoreA: integer("score_a").notNull().default(0),
  scoreB: integer("score_b").notNull().default(0),
  battlesA: integer("battles_a").notNull().default(0),
  battlesB: integer("battles_b").notNull().default(0),
  winnerId: integer("winner_id").references(() => players.id, {
    onDelete: "set null",
  }),
  finishType: text("finish_type"),
  status: text("status").notNull().default("scheduled"),
  playedAt: timestamp("played_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Beyblade = typeof beyblades.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type Registration = typeof registrations.$inferSelect;
export type Match = typeof matches.$inferSelect;
