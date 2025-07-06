// Ejemplos de uso del módulo de archivos desde el frontend

// 1. Subir un archivo asociado a un usuario
async function uploadUserFile(file: File, userId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  const response = await fetch('/api/files', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Error al subir el archivo');
  }

  return await response.json();
}

// 2. Subir un archivo asociado a un proyecto
async function uploadProjectFile(file: File, projectId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);

  const response = await fetch('/api/files', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Error al subir el archivo');
  }

  return await response.json();
}

// 3. Descargar un archivo
async function downloadFile(fileId: string, filename: string) {
  const response = await fetch(`/api/files/${fileId}`);
  
  if (!response.ok) {
    throw new Error('Error al descargar el archivo');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// 4. Obtener información de un archivo
async function getFileInfo(fileId: string) {
  const response = await fetch(`/api/files/info/${fileId}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener información del archivo');
  }

  return await response.json();
}

// 5. Listar archivos de un usuario
async function getUserFiles(userId: string) {
  const response = await fetch(`/api/files/user/${userId}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener archivos del usuario');
  }

  return await response.json();
}

// 6. Listar archivos de un proyecto
async function getProjectFiles(projectId: string) {
  const response = await fetch(`/api/files/project/${projectId}`);
  
  if (!response.ok) {
    throw new Error('Error al obtener archivos del proyecto');
  }

  return await response.json();
}

// 7. Eliminar un archivo
async function deleteFile(fileId: string) {
  const response = await fetch(`/api/files/${fileId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Error al eliminar el archivo');
  }

  return await response.json();
}

// Ejemplo de uso con React (comentado para evitar errores de TypeScript)
/*
function FileUploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadUserFile(file, '550e8400-e29b-41d4-a716-446655440000');
      console.log('Archivo subido:', result);
      // Actualizar la lista de archivos
      const updatedFiles = await getUserFiles('550e8400-e29b-41d4-a716-446655440000');
      setFiles(updatedFiles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDownload = async (fileId: string, filename: string) => {
    try {
      await downloadFile(fileId, filename);
    } catch (error) {
      console.error('Error al descargar:', error);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      // Actualizar la lista de archivos
      const updatedFiles = await getUserFiles('550e8400-e29b-41d4-a716-446655440000');
      setFiles(updatedFiles);
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>Subiendo archivo...</p>}
      
      <div>
        <h3>Archivos del usuario:</h3>
        {files.map((file: any) => (
          <div key={file.id}>
            <span>{file.filename}</span>
            <span> ({file.size} bytes)</span>
            <button onClick={() => handleFileDownload(file.id, file.filename)}>
              Descargar
            </button>
            <button onClick={() => handleFileDelete(file.id)}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
*/

// Ejemplo de uso con TypeScript
interface FileInfo {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
  userId?: string;
  projectId?: string;
  requestId?: string;
}

// Clase de servicio para archivos
class FileService {
  private baseUrl = '/api/files';

  async uploadFile(file: File, userId?: string, projectId?: string, requestId?: string): Promise<FileInfo> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (userId) formData.append('userId', userId);
    if (projectId) formData.append('projectId', projectId);
    if (requestId) formData.append('requestId', requestId);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/${fileId}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.blob();
  }

  async getFileInfo(fileId: string): Promise<FileInfo> {
    const response = await fetch(`${this.baseUrl}/info/${fileId}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getUserFiles(userId: string): Promise<FileInfo[]> {
    const response = await fetch(`${this.baseUrl}/user/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getProjectFiles(projectId: string): Promise<FileInfo[]> {
    const response = await fetch(`${this.baseUrl}/project/${projectId}`);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async deleteFile(fileId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${fileId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Exportar la clase de servicio
export { FileService }; 