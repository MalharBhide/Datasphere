import type { ParsedDataset } from '../features/cleaning/types'

/**
 * Built-in demonstration dataset containing all 6 detectable issue types:
 *  - Missing values (salary column)
 *  - Exact duplicate rows (rows 2 & 3)
 *  - Leading/trailing whitespace (name column)
 *  - Inconsistent capitalization (city column)
 *  - Numeric values stored as text (age column)
 *  - A numeric outlier by IQR (salary column — 9999)
 */
export const sampleDataset: ParsedDataset = {
  fileName: 'sample_dataset.csv',
  columns: ['id', 'name', 'age', 'city', 'department', 'salary'],
  rows: [
    { id: 1, name: 'Alice Johnson',    age: '29', city: 'New York',  department: 'Engineering', salary: 85000  },
    { id: 2, name: 'Bob Smith',        age: '34', city: 'chicago',   department: 'Marketing',   salary: 72000  },
    { id: 3, name: 'Bob Smith',        age: '34', city: 'chicago',   department: 'Marketing',   salary: 72000  }, // duplicate of row 2
    { id: 4, name: '  Carol White  ',  age: '41', city: 'CHICAGO',   department: 'Engineering', salary: 91000  }, // whitespace + casing
    { id: 5, name: 'David Lee',        age: '27', city: 'New York',  department: 'Sales',       salary: null   }, // missing salary
    { id: 6, name: 'Eve Martinez',     age: '38', city: 'Los Angeles', department: 'HR',        salary: 68000  },
    { id: 7, name: 'Frank Brown',      age: '45', city: 'new york',  department: 'Engineering', salary: 95000  }, // casing
    { id: 8, name: 'Grace Kim',        age: '31', city: 'Chicago',   department: 'Marketing',   salary: 76000  },
    { id: 9, name: ' Henry Davis',     age: '52', city: 'Los Angeles', department: 'Sales',     salary: null   }, // whitespace + missing
    { id: 10, name: 'Iris Wilson',     age: '29', city: 'NEW YORK',  department: 'Engineering', salary: 88000  }, // casing
    { id: 11, name: 'Jack Taylor',     age: '36', city: 'Chicago',   department: 'HR',          salary: 71000  },
    { id: 12, name: 'Karen Anderson',  age: '44', city: 'Los Angeles', department: 'Marketing', salary: 9999   }, // outlier
    { id: 13, name: 'Liam Thomas',     age: '28', city: 'New York',  department: 'Engineering', salary: 83000  },
    { id: 14, name: 'Mia Jackson',     age: '33', city: 'chicago',   department: 'Sales',       salary: 69000  }, // casing
    { id: 15, name: 'Noah Harris',     age: '39', city: 'Chicago',   department: 'HR',          salary: 74000  },
    { id: 16, name: 'Olivia Martin',   age: '26', city: 'Los Angeles', department: 'Marketing', salary: 67000  },
    { id: 17, name: 'Paul Garcia',     age: '48', city: 'New York',  department: 'Engineering', salary: 97000  },
    { id: 18, name: 'Quinn Martinez ', age: '31', city: 'Chicago',   department: 'Sales',       salary: 70000  }, // trailing whitespace
    { id: 19, name: 'Rachel Clark',    age: '37', city: 'Los Angeles', department: 'HR',        salary: null   }, // missing salary
    { id: 20, name: 'Sam Rodriguez',   age: '43', city: 'NEW YORK',  department: 'Marketing',   salary: 80000  }, // casing
  ],
}
