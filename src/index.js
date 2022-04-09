const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const Page = require("./models/Page");
const mongoose = require("mongoose");
const moment = require("moment");
const passport = require("./auth").passport;
const MongoStore = require("connect-mongo");
const Book = require("./models/Book");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({
      clientPromise: mongoose.connection.asPromise().then((c) => c.getClient()),
    }),
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/signin",
    successRedirect: "/",
  })
);

app.get("/signout", function (req, res) {
  req.logout();
  res.redirect("/signin");
});

app.get("/signin", (req, res) => {
  res.render("signin.ejs", {})
})

app.post("/", async (req, res) => {
  if (!req.user) {
    return res.redirect("/signin");
  }

  const pageNew = req.body["page_new"];
  if (pageNew !== undefined && pageNew !== null && pageNew !== "") {
    await Page.create({
      user: req.user._id,
      content: pageNew,
    });
  }

  const keys = Object.keys(req.body)
  const pageKeys = keys.filter((key) => key.startsWith("page_") && key !== "page_new")
  for (const pageKey of pageKeys) {
    console.log("processing", pageKey);
    const id = pageKey.split("_")[1];
    if (id) {
      const page = await Page.findOne({ _id: id, user: req.user._id })
      const currContent = req.body[pageKey];
      if (page.content !== currContent) {
        page.content = currContent;
        await page.save();
      }
    }
  }

  res.redirect("/");
});

app.post("/book/:book", async (req, res) => {
  if (!req.user) {
    return res.redirect("/signin");
  }

  const book = await Book.findOne({ name: req.params["book"] });
  if (!book) {
    return res.redirect("/");
  }

  const pageNew = req.body["page_new"];
  if (pageNew !== undefined && pageNew !== null && pageNew !== "") {
    await Page.create({
      user: req.user._id,
      book: book._id,
      content: pageNew,
    })
  }

  const keys = Object.keys(req.body)
  const pageKeys = keys.filter((key) => key.startsWith("page_") && key !== "page_new")
  await Promise.all(pageKeys.map(async (pageKey) => {
    const id = pageKey.split("_")[1];
    if (id) {
      const page = await Page.findOne({ _id: id, user: req.user._id })
      const currContent = req.body[pageKey];
      if (page.content !== currContent) {
        page.content = currContent;
        await page.save();
      }
    }
  }));

  console.log("redirecting", book.name)
  res.redirect("/book/" + book.name);
});

app.get("/book/:book", async (req, res) => {
  if (!req.user) {
    return res.redirect("/signin");
  }

  const book = await Book.findOne({
    name: req.params["book"],
    user: req.user._id,
  });
  if (!book) {
    return res.redirect("/");
  }

  const pages = await Page.find({
    user: req.user._id,
    book: book._id,
  }).sort({ _id: 1 });

  res.render("log.ejs", {
    pages,
    moment,
    user: req.user,
    book,
  });
});

app.post("/books/:bookId/delete", async (req, res) => {
  if (!req.user) {
    return res.redirect("/signin")
  }
  const id = req.params["bookId"];
  const book = await Book.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });
  if (!book) {
    return res.redirect("/books");
  }
  await Page.deleteMany({ book: id })
  res.redirect("/books");
});

app.post("/pages/:pageId/delete", async (req, res) => {
  if (!req.user) {
    return res.redirect("/signin")
  }
  const id = req.params["pageId"];
  const page = await Page.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });
  if (!page) {
    return res.redirect("/books");
  }
  const book = await Book.findOne({ _id: page.book })
  res.redirect("/book/" + book.name);
});

app.get("/books", async (req, res) => {
  if (!req.user) {
    return res.redirect("/signin");
  }

  const books = await Book.find({ user: req.user._id }).sort({ name: 1 });

  res.render("books.ejs", {
    moment,
    user: req.user,
    books,
  });
});

app.post("/books/new", async (req, res) => {
  if (!req.user) {
    return res.redirect("/signin");
  }

  const book = await Book.create({
    name: req.body.name,
    user: req.user._id,
  });

  res.redirect("/book/" + book.name);
});

app.get("/", async (req, res) => {
  if (!req.user) {
    return res.redirect("/signin");
  }

  res.redirect("/books");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on ${listener.address().port}`);
});
