pragma solidity 0.5.8;

import './AssetWithAmbi.sol';


contract AssetWithManager is AssetWithAmbi {
    bool public isTransferAllowed = true;

    event TransferAllowedSet(bool isAllowed);

    function isManager(address _caller) public view returns(bool) {
        return address(ambi2) != address(0) &&
            ambi2.hasRole(address(this), 'manager', _caller);
    }

    function setTransferAllowed(bool _value)
    public onlyRole('admin') returns(bool) {
        isTransferAllowed = _value;
        emit TransferAllowedSet(_value);
        return true;
    }

    function _transferWithReference(
        address _to,
        uint _value,
        string memory _reference,
        address _sender)
    internal returns(bool) {
        if (isManager(_sender) || isTransferAllowed) {
            return super._transferWithReference(
                _to, _value, _reference, _sender);
        }
        return false;
    }

    function _transferFromWithReference(
        address _from,
        address _to,
        uint _value,
        string memory _reference,
        address _sender)
    internal returns(bool) {
        if (isManager(_sender)) {
            return super._transferWithReference(
                _to, _value, _reference, _from);
        }
        if (isTransferAllowed) {
            return super._transferFromWithReference(
                _from, _to, _value, _reference, _sender);
        }
        return false;
    }

    function _transferToICAPWithReference(
        bytes32 _icap,
        uint _value,
        string memory _reference,
        address _sender)
    internal returns(bool) {
        if (isManager(_sender) || isTransferAllowed) {
            return super._transferToICAPWithReference(
                _icap, _value, _reference, _sender);
        }
        return false;
    }

    function _transferFromToICAPWithReference(
        address _from,
        bytes32 _icap,
        uint _value,
        string memory _reference,
        address _sender)
    internal returns(bool) {
        if (isManager(_sender)) {
            return super._transferToICAPWithReference(
                _icap, _value, _reference, _from);
        }
        if (isTransferAllowed) {
            return super._transferFromToICAPWithReference(
                _from, _icap, _value, _reference, _sender);
        }
        return false;
    }
}
