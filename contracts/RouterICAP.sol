pragma solidity 0.5.8;

import './RegistryICAP.sol';
import './SafeMin.sol';


contract Emitter {
    function emitTransferToICAP(
        address _from,
        address _to,
        bytes32 _icap,
        uint _value,
        string memory _reference
    ) public;

    function emitError(bytes32 _message) public;
}


contract RouterICAP is SafeMin {
    RegistryICAP public registryICAP;
    Emitter public eventsHistory;

    function _error(bytes32 _message) internal {
        eventsHistory.emitError(_message);
    }

    function setupRegistryICAP(RegistryICAP _registryICAP)
        public immutableAddr(address(registryICAP))
    returns(bool) {
        registryICAP = _registryICAP;
        return true;
    }

    function setupEventsHistory(Emitter _eventsHistory) public immutableAddr(address(eventsHistory))
    returns(bool) {
        eventsHistory = _eventsHistory;
        return true;
    }

    function transfer(bytes32 _icap, string memory _reference) public payable
    returns(bool) {
        address to;
        bool success;
        bytes32 filler;
        (to, filler, success) = registryICAP.parse(_icap);
        if (!success) {
            _error('Invalid ICAP');
            return _safeFalse();
        }
        if (to == msg.sender) {
            _error('Cannot send to oneself');
            return _safeFalse();
        }
        if (!_unsafeSend(to, msg.value)) {
            _error('Exception on receiver contract');
            return _safeFalse();
        }
        eventsHistory.emitTransferToICAP(msg.sender, to, _icap, msg.value, _reference);
        return true;
    }

    function transferToICAP(bytes32 _icap) public payable returns(bool) {
        return transferToICAPWithReference(_icap, '');
    }

    function transferToICAP(bytes32 _icap, uint _value) public payable returns(bool) {
        return transferToICAPWithReference(_icap, _value, '');
    }

    function transferToICAPWithReference(bytes32 _icap, string memory _reference)
    public payable returns(bool) {
        return transfer(_icap, _reference);
    }

    function transferToICAPWithReference(bytes32 _icap, uint _value, string memory _reference)
    public payable returns(bool) {
        if (msg.value != _value) {
            _error('Values does not match');
            return _safeFalse();
        }
        return transferToICAPWithReference(_icap, _reference);
    }
}
