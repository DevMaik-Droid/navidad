import supabase from "../supabaseClient";

// Obtener todos los nombres
export const fetchNombres = async () => {
  const { data, error } = await supabase
    .from("nombres_navidad")
    .select("nombres");    
  if (error) {
    console.error(error);
    return [];
  }

  return data?.map((row) => row.nombres) || [];
};

// Insertar un nuevo nombre
export const addNombre = async (nombres: string) => {
  const { data, error } = await supabase
    .from("nombres_navidad")
    .insert([{ nombres }]);

  if (error) console.error(error);
  return data;
};
