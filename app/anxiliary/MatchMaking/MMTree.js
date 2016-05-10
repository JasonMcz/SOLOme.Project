/**
* This is a Binary Search Tree to support the matchmaking process
**/


var List = require('./MMList.js');



/**
* Binary Search Tree Constructor
**/
function BinarySearchTree() {
    this.root = null,

    /**
    * Appends some data to the appropriate point in the tree. If there are no
    * nodes in the tree, the data becomes the root. If there are other nodes
    * in the tree, then the tree must be traversed to find the correct spot
    * for insertion.
    * @param {variant} value The data to add to the list.
    * @return {Object} if the added element makes the linked list length even,
    * then return the last 2 summoners
    * @method add
    */

    this.add = function(summoner) {
       var MMList = new List;
       var node = {
           data: {
             mmr: summoner.mmr,
             summoner: summoner,
             sumList: MMList,
           },
           left: null,
           right: null
         },
         current; // pointer

       if (this.root == null) {
         node.data.sumList.add(summoner);
         this.root = node;
         return;
       } else {
         current = this.root;
         var mmr = summoner.mmr;
         while (true) {
           var MMRTop = current.data.mmr + 50;
           var MMRBot = current.data.mmr - 50;
           if (mmr < MMRBot) {
             if (current.left === null) {
               node.data.sumList.add(summoner);
               current.left = node;
               return;
             } else {
               current = current.left;
             }
           } else if (mmr > MMRTop) {
             if (current.right === null) {
            	  node.data.sumList.add(summoner);
                current.right = node;
               return;
             } else {
               current = current.right;
             }
           } else {
             var llist = current.data.sumList;
             llist.add(summoner);
             if(llist.size == 2) {
               var now = +new Date();
               var time = new Date();
               var summoner1 = llist.popFirst().summoner;
               var summoner2 = llist.popFirst().summoner;
               var summoner1ID = summoner1.id;
               var summoner2ID = summoner2.id;
               var mmr1 = summoner1.mmr;
               var mmr2 = summoner2.mmr;
               var gameID = summoner1ID.toString() + summoner2ID.toString() + now.toString();
               gameID = Number(gameID).toString(36);
               var game = {
                  summoner1: {id: summoner1ID, mmr: mmr1},
                  summoner2: {id: summoner2ID, mmr: mmr2},
                  gameID: gameID,
                  time: time
                };
                console.log('currentNode: ',current);
               this.removeNode(current);
               return game;
             } else {
               return;
             }
           }
         }
       }
     },

     this.deleteASummoner = function(summoner) {
         var current = this.root,
           mmr = summoner.mmr;
         while (true) {
           var MMRTop = current.data.mmr + 50;
           var MMRBot = current.data.mmr - 50;
           if (mmr < MMRBot) {
             if (current.left === null) {
               break;
             } else {
               current = current.left;
             }
           } else if (mmr > MMRTop) {
             if (current.right === null) {
               break;
             } else {
               current = current.right;
             }
           } else {
             current.data.sumList.delete(summoner);
             var size = current.data.sumList.size;
             if (size == 1) {
             	current.data.mmr = current.data.sumList.end.summoner.mmr;
             };
             if (size == 0) {
               this.removeNode(current);
             }
             break;
           }
         }
       },


    /**
    * Traverses the tree and runs the given method on each node it comes
    * across while doing an in-order traversal.
    * @param {Function} process The function to run on each node.
    * @return {void}
    * @method traverse
    */
    this.traverse = function(process){

       //helper function
       function inOrder(node){
           if (node){

               //traverse the left subtree
               if (node.left !== null){
                   inOrder(node.left);
               }

               //call the process method on this node
               process.call(this, node);

               //traverse the right subtree
               if (node.right !== null){
                   inOrder(node.right);
               }
           }
       }

       //start with the root
       inOrder(this._root);
    },

  /**
   * Returns the number of items in the tree. To do this, a traversal
   * must be executed.
   * @return {int} The number of items in the tree.
   * @method size
   */
    this.size = function(){
        var length = 0;

        this.traverse(function(node){
            length++;
        });
        return length;
    },

    /**
    * Converts the tree into an array.
    * @return {Array} An array containing all of the data in the tree.
    * @method toArray
    */
    this.toArray = function(){
        var result = [];

        this.traverse(function(node){
            result.push(node.value);
        });

        return result;
    },

    /**
    * Converts the list into a string representation.
    * @return {String} A string representation of the list.
    * @method toString
    */
    this.toString = function(){
        return this.toArray().toString();
    },

    /**
    * Removes the node with the given value from the tree. This may require
    * moving around some nodes so that the binary search tree remains
    * properly balanced.
    * @param {variant} value The value to remove.
    * @return {void}
    * @method remove
    */

    this.removeNode = function(node) {

     var found = false,
       parent = null,
       current = this.root,
       mmr = node.data.mmr,
       childCount,
       replacement,
       replacementParent = {right: null, left: null, data: null};


     //make sure there's a node to search
     while (!found && current) {

       //if the value is less than the current node's, go left
       if (mmr < current.data.mmr) {
         parent = current;
         current = current.left;

         //if the value is greater than the current node's, go right
       } else if (mmr > current.data.mmr) {
         parent = current;
         current = current.right;

         //values are equal, found it!
       } else {
         found = true;
       }
     };

     //only proceed if the node was found
     if (found) {

       //figure out how many children
       childCount = (current.left !== null ? 1 : 0) + (current.right !== null ? 1 : 0);

       //special case: the value is at the root
       if (current.data.mmr === this.root.data.mmr) {
         switch (childCount) {

           //no children, just erase the root
           case 0:
             this.root = null;
             break;

             //one child, use one as the root
           case 1:
             this.root = (current.right === null ? current.left : current.right);
             break;

             //two children, little work to do
           case 2:

             //new root will be the old root's left child...maybe
             replacement = this.root.left;

             //find the right-most leaf node to be the real new root
             while (replacement.right !== null) {
               replacementParent = replacement;
               replacement = replacement.right;
             }
             //console.log('replaceMentParent:', replacementParent)
             //it's not the first node on the left
             if (replacementParent.root !== null) {

               //remove the new root from it's previous position
               replacementParent.right = replacement.left;

               //give the new root all of the old root's children
               replacement.right = this.root.right;
               replacement.left = this.root.left;
             } else {

               //just assign the children
               replacement.right = this.root.right;
             }

             //officially assign new root
             this.root = replacement;

             //no default

         }

         //non-root values
       } else {

         switch (childCount) {

           //no children, just remove it from the parent
           case 0:
             //if the current value is less than its parent's, null out the left pointer
             if (current.data.mmr < parent.data.mmr) {
               parent.left = null;

               //if the current value is greater than its parent's, null out the right pointer
             } else {
               parent.right = null;
             }
             break;

             //one child, just reassign to parent
           case 1:
             //if the current value is less than its parent's, reset the left pointer
             if (current.data.mmr < parent.data.mmr) {
               parent.left = (current.left === null ? current.right : current.left);

               //if the current value is greater than its parent's, reset the right pointer
             } else {
               parent.right = (current.left === null ? current.right : current.left);
             }
             break;

             //two children, a bit more complicated
           case 2:

             //reset pointers for new traversal
             replacement = current.left;
             replacementParent = current;

             //find the right-most node
             while (replacement.right !== null) {
               replacementParent = replacement;
               replacement = replacement.right;
             }
             replacementParent.right = replacement.left;

             //assign children to the replacement
             replacement.right = current.right;
             replacement.left = current.left;

             //place the replacement in the right spot
             if (current.data.mmr < parent.data.mmr) {
               parent.left = replacement;
             } else {
               parent.right = replacement;
             }
             //no default
         }

       }

     }

   }

};

module.exports = BinarySearchTree;
