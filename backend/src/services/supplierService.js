const supplierRepository = require('../repositories/supplierRepository');
const ApiError = require('../utils/ApiError');

const list = (search) => supplierRepository.findAll(search);

const getById = async (id) => {
  const supplier = await supplierRepository.findById(id);
  if (!supplier) throw new ApiError(404, 'Supplier not found.');
  return supplier;
};

const create = (payload) => supplierRepository.create(payload);

const update = async (id, fields) => {
  const updated = await supplierRepository.update(id, fields);
  if (!updated) throw new ApiError(404, 'Supplier not found.');
  return updated;
};

const remove = async (id) => {
  const supplier = await supplierRepository.findById(id);
  if (!supplier) throw new ApiError(404, 'Supplier not found.');
  const dependentCount = await supplierRepository.countMedicines(id);
  if (dependentCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete "${supplier.name}" — ${dependentCount} medicine(s) still reference this supplier. Reassign them first.`
    );
  }
  await supplierRepository.softDelete(id);
  return { id };
};

module.exports = { list, getById, create, update, remove };
