import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

const STORAGE_PREFIX = 'agrisaathi_entity_';

function readStore(name) {
  try {
    const value = localStorage.getItem(
      STORAGE_PREFIX + name
    );

    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeStore(name, data) {
  localStorage.setItem(
    STORAGE_PREFIX + name,
    JSON.stringify(data)
  );
}

function createId(name) {
  return [
    name.toLowerCase(),
    Date.now(),
    Math.random().toString(36).slice(2, 10)
  ].join('_');
}

function sortRecords(records, order) {
  if (!order) return records;

  const descending = order.startsWith('-');
  const field = descending
    ? order.slice(1)
    : order;

  return [...records].sort((a, b) => {
    const av = a?.[field];
    const bv = b?.[field];

    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    let result;

    if (
      typeof av === 'number' &&
      typeof bv === 'number'
    ) {
      result = av - bv;
    } else {
      result = String(av).localeCompare(
        String(bv)
      );
    }

    return descending ? -result : result;
  });
}

function createEntity(name) {
  return {
    async list(order = '', limit = 100) {
      const records = readStore(name);

      return sortRecords(
        records,
        order
      ).slice(0, limit);
    },

    async filter(
      filters = {},
      order = '',
      limit = 100
    ) {
      const records = readStore(name);

      const filtered = records.filter((record) =>
        Object.entries(filters).every(
          ([key, value]) =>
            record?.[key] === value
        )
      );

      return sortRecords(
        filtered,
        order
      ).slice(0, limit);
    },

    async get(id) {
      return (
        readStore(name).find(
          (record) => record.id === id
        ) || null
      );
    },

    async create(data = {}) {
      const records = readStore(name);

      const record = {
        ...data,
        id: data.id || createId(name),
        created_date:
          data.created_date ||
          new Date().toISOString(),
        updated_date:
          new Date().toISOString()
      };

      records.unshift(record);
      writeStore(name, records);

      return record;
    },

    async update(id, data = {}) {
      const records = readStore(name);

      const index = records.findIndex(
        (record) => record.id === id
      );

      if (index === -1) {
        throw new Error(
          `${name} record not found`
        );
      }

      records[index] = {
        ...records[index],
        ...data,
        updated_date:
          new Date().toISOString()
      };

      writeStore(name, records);

      return records[index];
    },

    async delete(id) {
      const records = readStore(name);

      writeStore(
        name,
        records.filter(
          (record) => record.id !== id
        )
      );

      return {
        success: true,
        id
      };
    }
  };
}

const entities = new Proxy(
  {},
  {
    get(_target, name) {
      return createEntity(String(name));
    }
  }
);

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json'
  }
});

http.interceptors.request.use(
  async (config) => {
    const user = getAuth().currentUser;

    if (user) {
      const token = await user.getIdToken();
      config.headers = config.headers || {};
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

export const api = {
  async get(url, config = {}) {
    const response = await http.get(
      url,
      config
    );

    return response.data;
  },

  async post(url, data = {}, config = {}) {
    const response = await http.post(
      url,
      data,
      config
    );

    return response.data;
  },

  async put(url, data = {}, config = {}) {
    const response = await http.put(
      url,
      data,
      config
    );

    return response.data;
  },

  async patch(url, data = {}, config = {}) {
    const response = await http.patch(
      url,
      data,
      config
    );

    return response.data;
  },

  async delete(url, config = {}) {
    const response = await http.delete(
      url,
      config
    );

    return response.data;
  }
};

export const auth = {
  async me() {
    try {
      const user = await api.get(
        '/api/users/me'
      );

      if (user) {
        localStorage.setItem(
          'agrisaathi_user',
          JSON.stringify(user)
        );
      }

      return user || {};
    } catch {
      try {
        const cached =
          localStorage.getItem(
            'agrisaathi_user'
          );

        return cached
          ? JSON.parse(cached)
          : {};
      } catch {
        return {};
      }
    }
  },

  async updateMe(data) {
    const updated = await api.patch(
      '/api/users/me',
      data
    );

    if (updated) {
      localStorage.setItem(
        'agrisaathi_user',
        JSON.stringify(updated)
      );
    }

    return updated;
  }
};

export const ai = {
  async invoke(data = {}) {
    return api.post(
      '/api/ai/invoke',
      data
    );
  },

  async chat(data = {}) {
    return api.post(
      '/api/ai/chat',
      data
    );
  },

  async diagnose(data = {}) {
    return api.post(
      '/api/diagnosis/analyze',
      data
    );
  }
};

export const files = {
  async upload(file) {
    const formData = new FormData();

    formData.append(
      'file',
      file
    );

    const response = await http.post(
      '/api/files/upload',
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data'
        }
      }
    );

    return response.data;
  }
};

export async function request(
  url,
  options = {}
) {
  const {
    method = 'GET',
    data,
    params,
    headers
  } = options;

  const response =
    await http.request({
      url,
      method,
      data,
      params,
      headers
    });

  return response.data;
}

export {
  API_BASE_URL,
  entities
};


/**
 * Generic backend request helper.
 *
 * Supports:
 *   appClient.call('/api/path')
 *   appClient.call('/api/path', { params: {...} })
 *   appClient.call('/api/path', { method: 'POST', data: {...} })
 */
export async function call(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  const config = {
    method,
    url: path,
    params: options.params,
    data: options.data,
    headers: options.headers,
  };

  const response = await http.request(config);
  return response?.data;
}

export default {
  call,
  api,
  auth,
  ai,
  files,
  entities,
  request,
  API_BASE_URL
};
