pragma solidity 0.5.8;

import './EventsHistory.sol';


contract RouterICAPEmitter {
    event TransferToICAP(
        address indexed from,
        address indexed to,
        bytes32 indexed icap,
        uint value,
        string ref,
        uint version
    );
    
    event Error(bytes32 message, uint version);

    function emitTransferToICAP(
        address _from,
        address _to,
        bytes32 _icap,
        uint _value,
        string memory _reference
    ) public {
        emit TransferToICAP(_from, _to, _icap, _value, _reference, _getVersion());
    }

    function emitError(bytes32 _message) public {
        emit Error(_message, _getVersion());
    }

    function _getVersion() internal view returns(uint) {
        return EventsHistory(address(this)).versions(msg.sender);
    }
}
