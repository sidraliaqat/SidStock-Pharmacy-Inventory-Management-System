const categoryRepository = require('../repositories/categoryRepository');
const ApiError = require('../utils/ApiError');

const list = (search) => categoryRepository.findAll(search);

const getById = async (id) => {
  const category = await categoryRepository.findById(id);
  if (!category) throw new ApiError(404, 'Category not found.');
  return category;
};

const create = async ({ name, description }) => {
  const clash = await categoryRepository.findByName(name);
  if (clash) throw new ApiError(409, `Category "${name}" already exists.`);
  return categoryRepository.create({ name, description });
};

const update = async (id, fields) => {
  if (fields.name) {
    const clash = await categoryRepository.findByName(fields.name, id);
    if (clash) throw new ApiError(409, `Category "${fields.name}" already exists.`);
  }
  const updated = await categoryRepository.update(id, fields);
  if (!updated) throw new ApiError(404, 'Category not found.');
  return updated;
};

const remove = async (id) => {
  const category = await categoryRepository.findById(id);
  if (!category) throw new ApiError(404, 'Category not found.');
  const dependentCount = await categoryRepository.countMedicines(id);
  if (dependentCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete "${category.name}" — ${dependentCount} medicine(s) still use this category. Reassign them first.`
    );
  }
  await categoryRepository.softDelete(id);
  return { id };
};

module.exports = { list, getById, create, update, remove };
