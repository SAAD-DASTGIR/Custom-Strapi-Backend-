"use strict";
module.exports = {
  routes: [
    {
      method: "GET",
      path: "/trees",
      handler: "tree.find",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/trees",
      handler: "tree.create",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "PUT",
      path: "/trees/:id",
      handler: "tree.update",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "DELETE",
      path: "/trees/:id",
      handler: "tree.delete",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/trees/move",
      handler: "tree.moveNode",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/trees/findfull",
      handler: "tree.findfull",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/trees/children/:parentId",
      handler: "tree.findChildren",
      config: {
        policies: [],
      },
    },
  ],
};
