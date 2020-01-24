# Skeleton Key 💀🔑

Skeleton Key is an application framework inspired by Wes Bos's Advanced React Course. It uses [React](https://reactjs.org), [Next.js](https://nextjs.org), [Apollo Client](https://www.apollographql.com/docs/react/), [GraphQL Yoga](https://github.com/prisma/graphql-yoga), and [Prisma](https://www.prisma.io).

## Installation

Use git to clone the three pieces of Skeleton Key:

```bash
git clone http://www.github.com/JakeCasey/skeleton-key-frontend.git
```

```bash
git clone http://www.github.com/JakeCasey/skeleton-key-backend.git
```

```bash
git clone http://www.github.com/JakeCasey/skeleton-key-prisma.git
```

## Bootstrapping the backend

Skeleton Key has the ability to bootstrap it's backend, and do a few simple tasks that makes setting up a new backend/db a breeze. [First ensure you have the Prisma CLI installed](https://www.prisma.io/docs/prisma-cli-and-configuration/using-the-prisma-cli-alx4/).

```bash
npm i prisma -g
```

Then log in to prisma cloud:

```bash
prisma login
```

Then run our bootstrap script with the -f flag. Currently -f is the only flag available, but there may be others in the future:

```bash
cd skeleton-key-backend
```

```bash
node bootstrap.js -f
```

The bootstrapper will ask several questions, then you'll be able to run:

```bash
npm run dev
```

to start your development backend.

## Running The Application

In the frontend (skeleton-key-frontend):

```bash
npm run dev
```

In the backend (skeleton-key_backend):

```bash
npm run dev
```

## Usage

Skeleton Key comes with it's backend model set up for you, so you already have a fully functioning application with user authentication and password recovery (provided you've put in your mailtrap details!) Isn't that sweet? But let's say you need to add another field to our data model.

```bash
TODO: Add examples of changing the datamodel and deploying to prisma.
```

## Purpose

The purpose of Skeleton Key is simple: To provide the fastest boilerplate for a full-stack web application. I couldn't find any great starting points for the kinds of applications I wanted to build. There's tons out there like [django-cookiecutter](https://github.com/pydanny/cookiecutter-django) that make it crazy easy to spin up apps; just not in the tech I wanted to use.

## Extras

A shell script that can be added to your .zshrc or .bashrc easily spin up new projects, and open their respective frontend and backends. DISCLAIMER: It will overwrite if you supply a pre-existing directory as the project name.

```bash
function newproject() {
  if [ -z "$1" ]
  then
    echo "No project name supplied."
    exit 1
  fi

  mkdir ./"$1"
  cd "$1"
  git clone https://github.com/JakeCasey/skeleton-key-backend.git &&
  git clone https://github.com/JakeCasey/skeleton-key-frontend.git &&
  git clone https://github.com/JakeCasey/skeleton-key-prisma.git
  $(openproject)
}

function openproject() {
  code ./skeleton-key-frontend
  code ./skeleton-key-backend
}
```

## Thanks

Inspired by [Wes Bos's Advanced React](https://advancedreact.com) (seriously, go buy this.)

Thanks to [WIP](http://wip.chat) 🚧

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
