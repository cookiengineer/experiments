var assert = require('assert');
var should = require('should');

var NeatParameters = require('../neatHelp/neatParameters.js');

describe('Incomplete: testing neatParameters.NeatParameters()',function(){

    it('NeatParameters(): should have certain parameters set by defaul', function(done){

        var np = new NeatParameters();

        //make sure we have the right size group, and setup
        np.connectionMutationParameterGroupList.length.should.equal(5);
        np.connectionMutationParameterGroupList[0].perturbationType.should.equal(NeatParameters.ConnectionPerturbationType.jiggleEven);
        np.connectionMutationParameterGroupList[1].perturbationType.should.equal(NeatParameters.ConnectionPerturbationType.jiggleEven);
        np.connectionMutationParameterGroupList[2].perturbationType.should.equal(NeatParameters.ConnectionPerturbationType.jiggleEven);
        np.connectionMutationParameterGroupList[3].perturbationType.should.equal(NeatParameters.ConnectionPerturbationType.reset);
        np.connectionMutationParameterGroupList[4].perturbationType.should.equal(NeatParameters.ConnectionPerturbationType.reset);

        np.connectionMutationParameterGroupList[0].selectionType.should.equal(NeatParameters.ConnectionSelectionType.proportional);
        np.connectionMutationParameterGroupList[1].selectionType.should.equal(NeatParameters.ConnectionSelectionType.proportional);
        np.connectionMutationParameterGroupList[2].selectionType.should.equal(NeatParameters.ConnectionSelectionType.fixedQuantity);
        np.connectionMutationParameterGroupList[3].selectionType.should.equal(NeatParameters.ConnectionSelectionType.proportional);
        np.connectionMutationParameterGroupList[4].selectionType.should.equal(NeatParameters.ConnectionSelectionType.fixedQuantity);

        done();

    });


    it('NeatDecoder(): should be able to correctly decode genome to CPPN, test against file?', function(done){

        ("Yet to write this test").should.equal("oops");

    });


});