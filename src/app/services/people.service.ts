import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class PeopleService {

  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;

  private initPromise: Promise<void> | null = null;

  // 1. INIT (GARANTIDO 1X SÓ)
  async init(): Promise<void> {

    if (this.db) return;

    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {

      this.db = await this.sqlite.createConnection(
        'people_db',
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();

      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS people (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT,
          apelido TEXT,
          localidade TEXT,
          grupo TEXT,
          eneagrama_tipo INTEGER,
          data TEXT
        );
      `);

      await this.seedIfEmpty();

    })();

    return this.initPromise;
  }

  // 2. SEED
  private async seedIfEmpty() {

    const res = await this.db.query(
      `SELECT COUNT(*) as total FROM people`
    );

    const total = res.values?.[0]?.total ?? 0;

    if (total > 0) return;

    await this.db.run(
      `INSERT INTO people (nome, apelido, localidade, grupo, eneagrama_tipo, data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Sandro', 'Coelho', 'Portalegre', 'Familia', 5, '1977-01-16']
    );

    await this.db.run(
      `INSERT INTO people (nome, apelido, localidade, grupo, eneagrama_tipo, data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Joana', 'Duarte', 'Porto', 'Familia', 4, '1981-01-16']
    );
  }

  // 3. GET ALL (SEMPRE SEGURO)
  async getAll() {

    await this.init();

    const res = await this.db.query(
      `SELECT * FROM people ORDER BY id DESC`
    );

    return res.values ?? [];
  }

  // 4. ADD
  async add(person: any) {

    await this.init();

    await this.db.run(
      `INSERT INTO people
      (nome, apelido, localidade, grupo, eneagrama_tipo, data)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        person.nome,
        person.apelido,
        person.localidade,
        person.grupo,
        person.eneagrama_tipo,
        person.data
      ]
    );
  }

  // 5. UPDATE
  async update(person: any) {

    await this.init();

    await this.db.run(
      `UPDATE people SET
        nome=?,
        apelido=?,
        localidade=?,
        grupo=?,
        eneagrama_tipo=?,
        data=?
       WHERE id=?`,
      [
        person.nome,
        person.apelido,
        person.localidade,
        person.grupo,
        person.eneagrama_tipo,
        person.data,
        person.id
      ]
    );
  }

  // 6. DELETE
  async delete(id: number) {

    await this.init();

    await this.db.run(
      `DELETE FROM people WHERE id=?`,
      [id]
    );
  }
}