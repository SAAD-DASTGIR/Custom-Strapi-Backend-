const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::tree.tree", ({ strapi }) => ({
  async find(ctx) {
    const { page = 1, pageSize = 10 } = ctx.query; // Add pagination parameters

    // Fetch parent nodes
    const result = await strapi.entityService.findPage("api::tree.tree", {
      filters: { parent: null },
      pagination: { page, pageSize },
      populate: "*",
    });

    // Check if each node has children and add hasChild property
    const data = await Promise.all(
      result.results.map(async (node) => {
        const childCount = await strapi.entityService.count("api::tree.tree", {
          filters: { parent: { id: node.id } }, // Correct structure for filtering by parent ID
        });

        return {
          id: node.id,
          attributes: {
            ...node,
            hasChild: childCount > 0,
          },
        };
      })
    );

    return { data, meta: result.pagination };
  },

  async findChildren(ctx) {
    const { parentId } = ctx.params;

    // Fetch child nodes
    const entities = await strapi.entityService.findMany("api::tree.tree", {
      filters: { parent: parentId },
      populate: "*",
    });

    // Add hasChild property to each node
    const data = await Promise.all(
      entities.map(async (entity) => {
        const childCount = await strapi.entityService.count("api::tree.tree", {
          // filters: { parent: entity.id }, // Count children of the current entity
          filters: { parent: { id: entity.id } }, // Correct structure for filtering by parent ID
        });

        return {
          id: entity.id,
          attributes: {
            ...entity,
            hasChild: childCount > 0, // Add hasChild property
          },
        };
      })
    );

    return { data };
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
        node.attributes.hasChild = false;
        nodeMap[node.id] = node;
      });

      nodes.forEach((node) => {
        if (node.attributes.parent?.data?.id) {
          const parentId = node.attributes.parent.data.id;
          nodeMap[parentId].attributes.children.push(node);
          nodeMap[parentId].attributes.hasChild = true;
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

    const nodeToMove = await strapi.entityService.findOne(
      "api::tree.tree",
      nodeId,
      {
        populate: ["parent"],
      }
    );

    const newParent = await strapi.entityService.findOne(
      "api::tree.tree",
      newParentId,
      {
        populate: ["parent"],
      }
    );

    if (!nodeToMove || !newParent) {
      return ctx.badRequest("Invalid node or parent node.");
    }

    const isDescendant = async (parentNode, targetNode) => {
      if (!parentNode) return false;
      if (parentNode.id === targetNode.id) return true;
      if (!parentNode.parent) return false;
      const parent = await strapi.entityService.findOne(
        "api::tree.tree",
        parentNode.parent.id,
        {
          populate: ["parent"],
        }
      );
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
