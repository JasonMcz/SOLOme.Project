/**
* This is a linked list module to support the matchmaking process.
**/


//List object with functionality
function List() {
  List.makeNode = function() {
    return {
      summoner: null,
      next: null
    }
  };

    this.size = 0,
  	this.start = null,
    this.end = null,

    /**
    * Appends some data to the LL. If there are no
    * nodes in the tree, the data becomes the start and end. If there are other nodes
    * in the LL, the data is inserted to the end of the LL
    * @param {variant} value The data to add to the list.
    * @return {Void}
    * @method add
    */
    this.add = function(summoner) {
    	this.size = this.size + 1;
      if (this.start === null) {
        this.start = List.makeNode();
        this.end = this.start;
      } else {
        this.end.next = List.makeNode();
        this.end = this.end.next;
      };
      this.end.summoner = summoner;
    },
    this.insertAsFirst = function(summoner) {
      var temp = List.makeNode();
      temp.next = this.start;
      this.start = temp;
      temp.summoner = summoner
    },

    /**
    * Deletes a node with given data from the LL. If it is the start node, then point a start node to the next node. If it is the end node,
    * point the end to the previous node. If it is a middle node, then point the previous node to the next node,
    * skipping the node being deleted.
    * @param {variant} value The data in the node to be deleted from the list.
    * @return {Void}
    * @method delete
    */

    this.delete = function(summoner) {

    this.size = this.size - 1;
      var current = this.start;
      var previous = this.start;
      while (current !== null) {
        if (summoner.mmr === current.summoner.mmr) {
          if (current === this.start) {
            this.start = current.next;
            return;
          }
          if (current === this.end) this.end = previous;
          previous.next = current.next
          return;
        }
        previous = current;
        current = current.next;
      }
    },

    /**
    * Returns the first element of the LL
    * @param {Void}
    * @return {Object} First element
    * @method popFirst
    */

    this.popFirst = function(){
      var temp = this.start;
      this.start = this.start.next;
      this.size = this.size - 1;
      return temp;
    },

    /**
    * Returns the last element of the LL
    * @param {Void}
    * @return {Object} Last element
    * @method popLast
    */

    this.popLast = function() {
      var temp = this.end;
      this.size = this.size - 1;

      var current = this.start;
      while(current.next.next !== null) {
        current = current.next;
      };
      this.end = current;
      return temp;
    }
};
module.exports = List;
