import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import knex from "knex";

const db = knex({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    port: 5432,
    user: "ihemelanduchinedu",
    password: "chinedu",
    database: "smart-brain",
  },
});

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Nice try :)");
});

app.post("/signin", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json("invalid inputs");
  }

  db.select("email", "hash")
    .from("login")
    .where("email", "=", email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data.at(0).hash);

      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", email)
          .then((data) => {
            res.json(data[0]);
          })
          .catch((err) => {
            res.status(400).json("Incorrect username or password");
          });
      } else {
        res.status(400).json("first wrong credentials");
      }
    })
    .catch((err) => res.status(400).json("second wrong credentials"));
});

app.post("/register", async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json("invalid inputs");
  }

  const hash = await bcrypt.hash(password, 12);

  db.transaction((trx) => {
    trx
      .insert({
        email,
        hash,
      })
      .into("login")
      .returning("email")
      .then((loginEmail) => {
        return db("users")
          .returning("*")
          .insert({
            email: loginEmail.at(0).email,
            name,
            joined: new Date(),
          })
          .then((response) => {
            res.json(response);
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) => res.status(400).json("Unable to register"));

  // console.log(database);
});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
  // const response = database.users.filter((el) => el.id === userID);
  db.select("*")
    .from("users")
    .where({ id })
    .then((user) => {
      if (user.length > 0) {
        res.json(user.at(0));
      } else {
        res.status(400).json("Not found");
      }
    })
    .catch((err) => res.status(400).json("Error getting user"));
});

app.put("/image", (req, res) => {
  const { id } = req.body;

  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then((data) => {
      res.json(data.at(0).entries);
    })
    .catch((err) => res.status(400).json("unable to return entries"));
});

app.listen(3001, () => {
  console.log("App is running");
});
