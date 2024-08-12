// const { createCoreController } = require("@strapi/strapi").factories;

// module.exports = createCoreController("api::tree.tree", ({ strapi }) => ({
//   async find(ctx) {
//     const result = await super.find(ctx);

//     const data = result.data || [];
//     const meta = result.meta || {};

//     const transformTreeData = (nodes) => {
//       const nodeMap = {};
//       const rootNodes = [];

//       nodes.forEach((node) => {
//         node.attributes.children = [];
//         node.attributes.hasChildren = false;
//         nodeMap[node.id] = node;
//       });

//       nodes.forEach((node) => {
//         if (node.attributes.parent?.data?.id) {
//           const parentId = node.attributes.parent.data.id;
//           nodeMap[parentId].attributes.children.push(node);
//           nodeMap[parentId].attributes.hasChildren = true;
//         } else {
//           rootNodes.push(node);
//         }
//       });

//       return rootNodes;
//     };

//     const transformedData = transformTreeData(data);

//     return { data: transformedData, meta };
//   },

//   async findChildren(ctx) { // USED IN PAGINATION IN PREVIOUS 4 LEVELS CODE
//     const { parentId } = ctx.params;
//     const entities = await strapi.entityService.findMany("api::tree.tree", {
//       filters: {
//         parent: parentId,
//       },
//     });

//     return {
//       data: entities.map((entity) => ({
//         id: entity.id,
//         attributes: entity,
//       })),
//     };
//   },



//   async moveNode(ctx) {
//     const { nodeId, newParentId } = ctx.request.body;

//     if (!nodeId || !newParentId) {
//       return ctx.badRequest("Node ID and New Parent ID are required.");
//     }

//     const nodeToMove = await strapi.entityService.findOne("api::tree.tree", nodeId, {
//       populate: ['parent'],
//     });

//     const newParent = await strapi.entityService.findOne("api::tree.tree", newParentId, {
//       populate: ['parent'],
//     });

//     if (!nodeToMove || !newParent) {
//       return ctx.badRequest("Invalid node or parent node.");
//     }

//     const isDescendant = async (parentNode, targetNode) => {
//       if (!parentNode) return false;
//       if (parentNode.id === targetNode.id) return true;
//       if (!parentNode.parent) return false;
//       const parent = await strapi.entityService.findOne("api::tree.tree", parentNode.parent.id, {
//         populate: ['parent'],
//       });
//       return isDescendant(parent, targetNode);
//     };

//     const invalidMove = await isDescendant(newParent, nodeToMove);

//     if (invalidMove) {
//       return ctx.badRequest("A parent cannot become a child of its own child.");
//     }

//     await strapi.entityService.update("api::tree.tree", nodeId, {
//       data: {
//         parent: newParentId,
//       },
//     });

//     return ctx.send({ message: "Node moved successfully" });
//   },
// }));


const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::tree.tree", ({ strapi }) => ({
  async find(ctx) {
    const { page = 1, pageSize = 10 } = ctx.query; // Add pagination parameters

    // Fetch only parent nodes initially
    const result = await strapi.entityService.findPage("api::tree.tree", {
      filters: { parent: null },
      pagination: { page, pageSize },
      populate: '*',
    });

    const data = result.results.map(node => ({
      id: node.id,
      attributes: node,
    }));

    return { data, meta: result.pagination };
  },

  async findChildren(ctx) {
    const { parentId } = ctx.params;
    const entities = await strapi.entityService.findMany("api::tree.tree", {
      filters: { parent: parentId },
      populate: '*',
    });

    return {
      data: entities.map(entity => ({
        id: entity.id,
        attributes: entity,
      })),
    };
  },

    async findfull(ctx) {
    const result = await super.find(ctx);

    const data = result.data || [];
    const meta = result.meta || {};

    const transformTreeData = (nodes) => {
      const nodeMap = {};
      const rootNodes = [];

      nodes.forEach((node) => {
        node.attributes.children = [];
        node.attributes.hasChildren = false;
        nodeMap[node.id] = node;
      });

      nodes.forEach((node) => {
        if (node.attributes.parent?.data?.id) {
          const parentId = node.attributes.parent.data.id;
          nodeMap[parentId].attributes.children.push(node);
          nodeMap[parentId].attributes.hasChildren = true;
        } else {
          rootNodes.push(node);
        }
      });

      return rootNodes;
    };

    const transformedData = transformTreeData(data);

    return { data: transformedData, meta };
  },

  async moveNode(ctx) {
    const { nodeId, newParentId } = ctx.request.body;

    if (!nodeId || !newParentId) {
      return ctx.badRequest("Node ID and New Parent ID are required.");
    }

    const nodeToMove = await strapi.entityService.findOne("api::tree.tree", nodeId, {
      populate: ['parent'],
    });

    const newParent = await strapi.entityService.findOne("api::tree.tree", newParentId, {
      populate: ['parent'],
    });

    if (!nodeToMove || !newParent) {
      return ctx.badRequest("Invalid node or parent node.");
    }

    const isDescendant = async (parentNode, targetNode) => {
      if (!parentNode) return false;
      if (parentNode.id === targetNode.id) return true;
      if (!parentNode.parent) return false;
      const parent = await strapi.entityService.findOne("api::tree.tree", parentNode.parent.id, {
        populate: ['parent'],
      });
      return isDescendant(parent, targetNode);
    };

    const invalidMove = await isDescendant(newParent, nodeToMove);

    if (invalidMove) {
      return ctx.badRequest("Cannot move node to its descendant.");
    }

    // Move node
    await strapi.entityService.update("api::tree.tree", nodeId, {
      data: { parent: newParentId },
    });

    return { message: "Node moved successfully." };
  },
}));

