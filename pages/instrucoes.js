import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";

export default function Instrucoes() {

    const [lista, setLista] = useState([]);

    const [titulo, setTitulo] = useState("");
    const [caminho, setCaminho] = useState("");
    const [categoria, setCategoria] = useState("");

    const [isSupervisor, setIsSupervisor] = useState(false);

    useEffect(() => {
        carregar();
        verificarPermissao();
    }, []);

    async function verificarPermissao() {

        const { data } = await supabase.auth.getUser();

        if (!data?.user) return;

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle();

        if (profile?.role === "Supervisor") {
            setIsSupervisor(true);
        }

    }

    async function carregar() {

        const { data } = await supabase
            .from("instrucoes_trabalho")
            .select("*")
            .order("titulo");

        setLista(data || []);

    }

    async function salvar() {

        if (!titulo || !caminho) {
            alert("Preencha o título e o caminho.");
            return;
        }

        const { error } = await supabase
            .from("instrucoes_trabalho")
            .insert({
                titulo,
                caminho,
                categoria
            });

        if (error) {
            alert(error.message);
            return;
        }

        setTitulo("");
        setCategoria("");
        setCaminho("");

        carregar();

    }

    async function excluir(id) {

        if (!confirm("Deseja realmente excluir esta instrução?"))
            return;

        const { error } = await supabase
            .from("instrucoes_trabalho")
            .delete()
            .eq("id", id);

        if (error) {
            alert(error.message);
            return;
        }

        carregar();

    }

    async function copiar(texto) {

        await navigator.clipboard.writeText(texto);

        alert("Caminho copiado com sucesso!");

    }

    return (

        <Layout>

            <div style={{ padding: 25 }}>

                <h1>Instruções de Trabalho</h1>

                {isSupervisor && (

                    <div
                        style={{
                            border: "1px solid #DDD",
                            borderRadius: 8,
                            padding: 20,
                            marginBottom: 30
                        }}
                    >

                        <h2>Novo Link</h2>

                        <input
                            placeholder="Título"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            style={{
                                width: "100%",
                                padding: 10,
                                marginBottom: 10
                            }}
                        />

                        <input
                            placeholder="Categoria"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            style={{
                                width: "100%",
                                padding: 10,
                                marginBottom: 10
                            }}
                        />

                        <input
                            placeholder="Caminho de Rede"
                            value={caminho}
                            onChange={(e) => setCaminho(e.target.value)}
                            style={{
                                width: "100%",
                                padding: 10,
                                marginBottom: 15
                            }}
                        />

                        <button onClick={salvar}>
                            Salvar
                        </button>

                    </div>

                )}

                {lista.map((item) => (

                    <div
                        key={item.id}
                        style={{
                            border: "1px solid #DDD",
                            borderRadius: 8,
                            padding: 20,
                            marginBottom: 15
                        }}
                    >

                        <h3>{item.titulo}</h3>

                        {item.categoria && (
                            <p>
                                <strong>Categoria:</strong> {item.categoria}
                            </p>
                        )}

                        <input
                            readOnly
                            value={item.caminho}
                            style={{
                                width: "100%",
                                padding: 10,
                                marginBottom: 15
                            }}
                        />

                        <button onClick={() => copiar(item.caminho)}>
                            📋 Copiar Caminho
                        </button>

                        {isSupervisor && (

                            <button
                                onClick={() => excluir(item.id)}
                                style={{
                                    marginLeft: 10,
                                    background: "#d32f2f",
                                    color: "#FFF"
                                }}
                            >
                                Excluir
                            </button>

                        )}

                    </div>

                ))}

            </div>

        </Layout>

    );

}
